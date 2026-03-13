import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const hotel = await prisma.hotel.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      whatsappUrl: true,
      plan: true,
    },
  });

  if (!hotel) {
    return new NextResponse("// Hotel not found", {
      status: 404,
      headers: { "Content-Type": "application/javascript" },
    });
  }

  // Widget loader script — injects iframe-based chat widget
  const widgetScript = `
(function() {
  if (document.getElementById('hotelwhiz-widget')) return;

  var baseUrl = '${req.nextUrl.origin}';
  var slug = '${hotel.slug}';
  var hotelName = ${JSON.stringify(hotel.name)};
  var waUrl = ${JSON.stringify(hotel.whatsappUrl || "")};
  var plan = '${hotel.plan}';

  // Create bubble button
  var bubble = document.createElement('div');
  bubble.id = 'hotelwhiz-widget';
  bubble.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:99999;';
  bubble.innerHTML = \`
    <div id="hw-bubble" style="width:60px;height:60px;border-radius:50%;background:linear-gradient(135deg,#3b82f6,#06b6d4);cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 20px rgba(59,130,246,0.4);transition:transform 0.2s;" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"/></svg>
    </div>
    <div id="hw-chat" style="display:none;position:absolute;bottom:76px;right:0;width:370px;height:520px;background:#0f172a;border-radius:16px;box-shadow:0 20px 60px rgba(0,0,0,0.5);border:1px solid #334155;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;flex-direction:column;">
      <div style="padding:16px 20px;background:#1e293b;border-bottom:1px solid #334155;display:flex;align-items:center;flex-shrink:0;">
        <div style="flex:1">
          <div style="font-size:15px;font-weight:600;color:white;">\${hotelName}</div>
          <div style="font-size:12px;color:#94a3b8;margin-top:2px;">AI Concierge — Online</div>
        </div>
        <div id="hw-close" style="cursor:pointer;color:#94a3b8;font-size:20px;padding:4px 8px;">✕</div>
      </div>
      <div id="hw-messages" style="padding:16px;flex:1;overflow-y:auto;min-height:0;">
        <div style="background:#1e293b;border:1px solid #334155;padding:12px 16px;border-radius:12px;border-top-left-radius:4px;margin-bottom:12px;max-width:85%;">
          <p style="color:#e2e8f0;font-size:14px;line-height:1.5;margin:0;">Hey! 👋 I'm here to help. What would you like to know?</p>
          <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:10px;">
            <button class="hw-quick" style="padding:6px 12px;background:#334155;border:1px solid #475569;border-radius:8px;color:#e2e8f0;font-size:13px;cursor:pointer;transition:all 0.2s;white-space:nowrap;" onmouseover="this.style.background='#475569'" onmouseout="this.style.background='#334155'">Do you have a pool?</button>
            <button class="hw-quick" style="padding:6px 12px;background:#334155;border:1px solid #475569;border-radius:8px;color:#e2e8f0;font-size:13px;cursor:pointer;transition:all 0.2s;white-space:nowrap;" onmouseover="this.style.background='#475569'" onmouseout="this.style.background='#334155'">Breakfast included?</button>
            <button class="hw-quick" style="padding:6px 12px;background:#334155;border:1px solid #475569;border-radius:8px;color:#e2e8f0;font-size:13px;cursor:pointer;transition:all 0.2s;white-space:nowrap;" onmouseover="this.style.background='#475569'" onmouseout="this.style.background='#334155'">Room prices?</button>
            <button class="hw-quick" style="padding:6px 12px;background:#334155;border:1px solid #475569;border-radius:8px;color:#e2e8f0;font-size:13px;cursor:pointer;transition:all 0.2s;white-space:nowrap;" onmouseover="this.style.background='#475569'" onmouseout="this.style.background='#334155'">How far is beach?</button>
          </div>
        </div>
      </div>
      <div style="padding:12px 16px;border-top:1px solid #334155;display:flex;gap:8px;align-items:center;flex-shrink:0;">
        <input id="hw-input" type="text" placeholder="Ask about our hotel..." style="flex:1;padding:10px 14px;background:#1e293b;border:1px solid #334155;border-radius:10px;color:white;font-size:14px;outline:none;min-width:0;" />
        <button id="hw-send" style="padding:10px 16px;background:#3b82f6;border:none;border-radius:10px;color:white;cursor:pointer;font-size:14px;font-weight:500;flex-shrink:0;">Send</button>
      </div>
      \${plan === 'FREE' ? '<div style="text-align:center;padding:6px;font-size:10px;color:#64748b;border-top:1px solid #1e293b;flex-shrink:0;">Powered by <a href="https://hotelwhiz.ai" target="_blank" style="color:#3b82f6;text-decoration:none;">HotelWhiz.ai</a></div>' : ''}
    </div>
  \`;
  document.body.appendChild(bubble);

  // Toggle chat
  var chatEl = document.getElementById('hw-chat');
  var bubbleBtn = document.getElementById('hw-bubble');
  document.getElementById('hw-bubble').addEventListener('click', function() {
    chatEl.style.display = 'flex';
    bubbleBtn.style.display = 'none';
  });
  document.getElementById('hw-close').addEventListener('click', function() {
    chatEl.style.display = 'none';
    bubbleBtn.style.display = 'flex';
  });

  // Chat messaging via API
  var messagesEl = document.getElementById('hw-messages');
  var inputEl = document.getElementById('hw-input');
  var sendBtn = document.getElementById('hw-send');
  var sessionId = 'hw-' + Math.random().toString(36).substr(2, 9);

  function addMessage(text, isUser, suggestions) {
    var div = document.createElement('div');
    div.style.cssText = isUser
      ? 'background:#3b82f6;padding:12px 16px;border-radius:12px;border-top-right-radius:4px;margin-bottom:12px;max-width:85%;margin-left:auto;'
      : 'background:#1e293b;border:1px solid #334155;padding:12px 16px;border-radius:12px;border-top-left-radius:4px;margin-bottom:12px;max-width:85%;';

    var html = '<p style="color:#e2e8f0;font-size:14px;line-height:1.5;margin:0;">' + text + '</p>';

    // Add suggestion buttons if provided
    if (suggestions && suggestions.length > 0) {
      html += '<div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:10px;">';
      suggestions.forEach(function(sug) {
        html += '<button class="hw-suggestion" style="padding:6px 12px;background:#334155;border:1px solid #475569;border-radius:8px;color:#e2e8f0;font-size:13px;cursor:pointer;transition:all 0.2s;" onmouseover="this.style.background=\\'#475569\\'" onmouseout="this.style.background=\\'#334155\\'">' + sug + '</button>';
      });
      html += '</div>';
    }

    div.innerHTML = html;
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;

    // Add click handlers for suggestion buttons
    if (suggestions && suggestions.length > 0) {
      div.querySelectorAll('.hw-suggestion').forEach(function(btn) {
        btn.addEventListener('click', function() {
          inputEl.value = this.textContent.trim();
          handleSend();
        });
      });
    }

    return div;
  }

  function addTyping() {
    var div = document.createElement('div');
    div.id = 'hw-typing';
    div.style.cssText = 'background:#1e293b;border:1px solid #334155;padding:12px 16px;border-radius:12px;border-top-left-radius:4px;margin-bottom:12px;max-width:85%;';
    div.innerHTML = \`
      <p style="color:#94a3b8;font-size:14px;margin:0;display:flex;align-items:center;gap:8px;">
        <span>Typing</span>
        <span style="display:inline-flex;gap:2px;">
          <span class="dot" style="width:4px;height:4px;background:#94a3b8;border-radius:50%;animation:hw-bounce 1.4s infinite both;animation-delay:0s;"></span>
          <span class="dot" style="width:4px;height:4px;background:#94a3b8;border-radius:50%;animation:hw-bounce 1.4s infinite both;animation-delay:0.2s;"></span>
          <span class="dot" style="width:4px;height:4px;background:#94a3b8;border-radius:50%;animation:hw-bounce 1.4s infinite both;animation-delay:0.4s;"></span>
        </span>
      </p>
    \`;
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;

    // Add animation keyframes if not already exists
    if (!document.getElementById('hw-anim-style')) {
      var style = document.createElement('style');
      style.id = 'hw-anim-style';
      style.innerHTML = '@keyframes hw-bounce { 0%, 80%, 100% { transform: translateY(0); } 40% { transform: translateY(-6px); } }';
      document.head.appendChild(style);
    }
  }

  function removeTyping() {
    var t = document.getElementById('hw-typing');
    if (t) t.remove();
  }

  function handleSend() {
    var msg = inputEl.value.trim();
    if (!msg) return;
    addMessage(msg, true);
    inputEl.value = '';
    sendBtn.disabled = true;
    addTyping();

    fetch(baseUrl + '/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: slug, message: msg, sessionId: sessionId })
    })
    .then(function(res) { return res.json(); })
    .then(function(data) {
      removeTyping();
      sendBtn.disabled = false;
      var reply = data.reply || 'Sorry, something went wrong.';
      if (data.waUrl && (data.intent === 'booking' || reply.includes('WhatsApp'))) {
        reply += ' <a href="' + data.waUrl + '" target="_blank" style="color:#3b82f6;text-decoration:underline;display:inline-block;margin-top:6px;">Chat on WhatsApp →</a>';
      }
      addMessage(reply, false, data.suggestions || []);
    })
    .catch(function() {
      removeTyping();
      sendBtn.disabled = false;
      addMessage('Sorry, there was an error. Please try again.', false);
    });
  }

  sendBtn.addEventListener('click', handleSend);
  inputEl.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') handleSend();
  });

  // Handle initial quick reply buttons
  setTimeout(function() {
    document.querySelectorAll('.hw-quick').forEach(function(btn) {
      btn.addEventListener('click', function() {
        inputEl.value = this.textContent.trim();
        handleSend();
      });
    });
  }, 100);
})();
`;

  return new NextResponse(widgetScript, {
    headers: {
      "Content-Type": "application/javascript",
      "Cache-Control": "public, max-age=300",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
