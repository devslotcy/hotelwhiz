import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { FREE_MESSAGE_LIMIT, formatMonth } from "@/lib/utils";
import { getAIResponse, detectIntent, isAIConfigured } from "@/lib/ai-service";
import { checkRateLimit } from "@/lib/rate-limiter";
import { emitNewMessage } from "@/lib/socket";

export async function POST(req: NextRequest) {
  try {
    const { slug, message, sessionId } = await req.json();

    if (!slug || !message) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const hotel = await prisma.hotel.findUnique({
      where: { slug },
      include: {
        knowledgeBase: {
          where: { answer: { not: "" } },
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    if (!hotel) {
      return NextResponse.json({ error: "Hotel not found" }, { status: 404 });
    }

    // Check usage limit
    const month = formatMonth();
    const usage = await prisma.usage.upsert({
      where: { hotelId_month: { hotelId: hotel.id, month } },
      update: { messageCount: { increment: 1 } },
      create: { hotelId: hotel.id, month, messageCount: 1, waRedirectCount: 0 },
    });

    if (hotel.plan === "FREE" && usage.messageCount > FREE_MESSAGE_LIMIT) {
      return NextResponse.json({
        reply: "This hotel has reached its monthly message limit. Please contact us directly via WhatsApp.",
        waUrl: hotel.whatsappUrl,
        limitReached: true,
      });
    }

    // Create/find conversation
    const convSessionId = sessionId || `anon-${Date.now()}`;
    let conversation = await prisma.conversation.findFirst({
      where: { hotelId: hotel.id, sessionId: convSessionId },
      orderBy: { startedAt: "desc" },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          hotelId: hotel.id,
          sessionId: convSessionId,
          sourceUrl: req.headers.get("referer") || null,
        },
      });
    }

    // Save user message
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: "USER",
        content: message,
      },
    });

    // Smart keyword matching against KB
    const msgLower = message.toLowerCase().trim();
    let bestMatch: { answer: string; question: string } | null = null;
    let bestScore = 0;

    // Remove common filler words for better matching
    const stopWords = ['the', 'is', 'are', 'do', 'does', 'a', 'an', 'what', 'how', 'when', 'where', 'can', 'you', 'your', 'have', 'has'];
    const msgWords = msgLower.split(/\s+/).filter((w: string) => w.length > 2 && !stopWords.includes(w));

    for (const kb of hotel.knowledgeBase) {
      const questionLower = kb.question.toLowerCase();
      const questionWords = questionLower.split(/\s+/).filter((w: string) => w.length > 2 && !stopWords.includes(w));

      let score = 0;

      // Check for important keyword matches
      for (const msgWord of msgWords) {
        if (questionWords.includes(msgWord)) {
          score += 2; // Exact word match = +2
        } else if (questionWords.some((qw: string) => qw.includes(msgWord) || msgWord.includes(qw))) {
          score += 1; // Partial match = +1
        }
      }

      // Bonus: if full question contains the user message (substring match)
      if (questionLower.includes(msgLower)) {
        score += 3;
      }

      if (score > bestScore) {
        bestScore = score;
        bestMatch = { answer: kb.answer, question: kb.question };
      }
    }

    // Booking intent detection
    const bookingKeywords = ["book", "reserve", "reservation", "price", "rate", "available", "availability", "room", "cost", "how much"];
    const isBooking = bookingKeywords.some((kw) => msgLower.includes(kw));

    // Detect casual/greeting messages (should go to AI for natural conversation)
    const greetingKeywords = ["hi", "hello", "hey", "good morning", "good evening", "good night", "how are you", "thanks", "thank you", "bye", "goodbye", "สวัสดี", "你好", "привет", "hola"];
    const isGreeting = greetingKeywords.some((kw) => msgLower.includes(kw)) || msgLower.trim().length < 15; // Short messages likely greetings

    let reply: string;
    let intent: string | null = null;
    let aiUsed = false;
    let modelUsed: string | null = null;

    // Step 1: Try KB match first (fast & accurate for known questions) - UNLESS it's a greeting
    if (bestMatch && bestScore >= 3 && !isGreeting) {
      reply = bestMatch.answer;
      modelUsed = "kb";

      // If booking intent, append WA suggestion
      if (isBooking && hotel.whatsappUrl) {
        intent = "booking";
        reply += "\n\n💬 For booking and best rates, chat with us directly on WhatsApp!";
      }
    }
    // Step 2: No good KB match → Try AI (if configured)
    else if (isAIConfigured()) {
      console.log("[Chat] No KB match, trying AI...");

      // Check rate limit before calling AI
      if (!checkRateLimit(hotel.id)) {
        console.warn(`[Chat] Rate limit exceeded for hotel ${hotel.id}`);
        reply = "We're receiving high traffic right now. Please try again in a moment or contact us directly via WhatsApp.";
        modelUsed = "rate-limited";
      } else {
        // Get recent conversation history for context (last 3 turns = 6 messages)
        const recentMessages = await prisma.message.findMany({
          where: { conversationId: conversation.id },
          orderBy: { createdAt: "desc" },
          take: 6,
        });

        const conversationHistory = recentMessages.reverse().map((msg) => ({
          role: msg.role,
          content: msg.content,
        }));

        const aiResponse = await getAIResponse({
          hotelContext: {
            name: hotel.name,
            address: hotel.address,
            phone: hotel.phone,
            website: hotel.website,
            whatsappUrl: hotel.whatsappUrl,
            description: hotel.description,
            knowledgeBase: hotel.knowledgeBase,
          },
          userMessage: message,
          conversationHistory,
        });

        reply = aiResponse.answer;
        aiUsed = aiResponse.model !== "none";
        modelUsed = aiResponse.model === "none" ? null : aiResponse.model;

        // Detect intent from AI response
        const detectedIntent = detectIntent(aiResponse.answer);
        if (detectedIntent) {
          intent = detectedIntent;
        }
      }
    }
    // Step 3: Fallback (no KB, no AI)
    else {
      if (isGreeting) {
        // Friendly greeting response even without AI (detect language)
        const isThai = msgLower.includes("สวัสดี");
        const isChinese = msgLower.includes("你好") || msgLower.includes("您好");
        const isRussian = msgLower.includes("привет");

        if (isThai) {
          reply = "สวัสดีค่ะ! 😊 มีอะไรให้ช่วยเกี่ยวกับ " + hotel.name + " ไหมคะ?";
        } else if (isChinese) {
          reply = "你好！😊 有什么关于 " + hotel.name + " 的问题吗？";
        } else if (isRussian) {
          reply = "Привет! 😊 Чем могу помочь про " + hotel.name + "?";
        } else {
          reply = "Hey there! 😊 I'm here to help. What would you like to know about " + hotel.name + "?";
        }
      } else if (isBooking && hotel.whatsappUrl) {
        intent = "booking";
        reply = "I'd love to help with your reservation! For the best rates and direct booking, please chat with us on WhatsApp.";
      } else {
        reply = hotel.whatsappUrl
          ? "That's a great question! I don't have that specific info yet, but our team can help you right away on WhatsApp."
          : "Thanks for your question! Our team will be able to help you with that soon.";
      }
      modelUsed = "fallback";
    }

    // Save assistant reply with AI tracking
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: "ASSISTANT",
        content: reply,
        intent,
        aiUsed,
        modelUsed,
      },
    });

    // Update conversation lastMessageAt and mark as unread
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { lastMessageAt: new Date(), isRead: false },
    });

    // Emit real-time notification to hotel dashboard
    emitNewMessage(hotel.id, {
      sessionId: convSessionId,
      message,
      reply,
      intent,
      modelUsed,
      conversationId: conversation.id,
      timestamp: new Date().toISOString(),
    });

    // Generate quick reply suggestions
    const suggestions: string[] = [];

    if (isGreeting) {
      // For greetings: suggest specific popular questions from KB
      const popularQuestions = hotel.knowledgeBase
        .filter(kb => kb.answer.trim().length > 0)
        .slice(0, 4) // Top 4 KB entries
        .map(kb => {
          // Shorten question for button (max 30 chars)
          let q = kb.question;
          if (q.length > 35) {
            q = q.substring(0, 32) + '...';
          }
          return q;
        });

      if (popularQuestions.length > 0) {
        suggestions.push(...popularQuestions);
      } else {
        // Fallback if no KB
        suggestions.push('Do you have a pool?', 'What time is breakfast?', 'Room prices?', 'How far is the beach?');
      }
    } else {
      // After answering: suggest related follow-up questions
      const msgWords = msgLower.split(/\s+/);

      // If they asked about pool, suggest breakfast
      if (msgWords.some((w: string) => ['pool', 'swim', 'facility'].includes(w))) {
        const breakfastKB = hotel.knowledgeBase.find(kb =>
          kb.question.toLowerCase().includes('breakfast') || kb.category === 'meals'
        );
        if (breakfastKB) suggestions.push(breakfastKB.question);
      }

      // If they asked about breakfast, suggest checkout
      if (msgWords.some((w: string) => ['breakfast', 'food', 'meal', 'restaurant'].includes(w))) {
        const checkoutKB = hotel.knowledgeBase.find(kb =>
          kb.question.toLowerCase().includes('check') && kb.question.toLowerCase().includes('out')
        );
        if (checkoutKB) suggestions.push(checkoutKB.question);
      }

      // If they asked about location, suggest transport
      if (msgWords.some((w: string) => ['beach', 'location', 'distance', 'far'].includes(w))) {
        const transportKB = hotel.knowledgeBase.find(kb =>
          kb.question.toLowerCase().includes('airport') || kb.question.toLowerCase().includes('transfer')
        );
        if (transportKB) suggestions.push(transportKB.question);
      }

      // Add pricing if not already discussed
      if (!msgWords.some((w: string) => ['price', 'cost', 'rate'].includes(w)) && suggestions.length < 2) {
        const priceKB = hotel.knowledgeBase.find(kb =>
          kb.question.toLowerCase().includes('price') || kb.category === 'pricing'
        );
        if (priceKB) suggestions.push(priceKB.question);
      }

      // Limit to 3 suggestions max
      suggestions.splice(3);
    }

    return NextResponse.json(
      { reply, waUrl: hotel.whatsappUrl, intent, aiUsed, modelUsed, suggestions },
      { headers: { "Access-Control-Allow-Origin": "*" } }
    );
  } catch (err) {
    console.error("Chat error:", err);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500, headers: { "Access-Control-Allow-Origin": "*" } }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
