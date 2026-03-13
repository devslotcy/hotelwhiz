import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import { Code, MessageSquare, ExternalLink, ArrowLeft, BookOpen, Sparkles, MessageCircle } from "lucide-react";
import Link from "next/link";
import { KBSection } from "./kb-section";
import { KB_CATEGORIES } from "@/lib/kb-templates";

export const dynamic = "force-dynamic";

export default async function HotelDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const { slug } = await params;

  const hotel = await prisma.hotel.findUnique({
    where: { slug },
    include: {
      knowledgeBase: { orderBy: { sortOrder: "asc" } },
      conversations: {
        include: {
          messages: {
            where: { role: "ASSISTANT" },
            select: { aiUsed: true, modelUsed: true },
          },
        },
      },
    },
  });

  if (!hotel || hotel.ownerId !== session.user.id) notFound();

  // Get WA redirect count for this month
  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const usage = await prisma.usage.findUnique({
    where: { hotelId_month: { hotelId: hotel.id, month } },
  });

  // Calculate AI usage stats
  const allMessages = hotel.conversations.flatMap((c) => c.messages);
  const aiUsedCount = allMessages.filter((m) => m.aiUsed).length;
  const groqCount = allMessages.filter((m) => m.modelUsed === "groq").length;
  const openaiCount = allMessages.filter((m) => m.modelUsed === "openai").length;
  const kbCount = allMessages.filter((m) => m.modelUsed === "kb").length;

  const widgetUrl = `${process.env.NEXTAUTH_URL || "https://hotelwhiz.ai"}/api/widget/${hotel.slug}`;
  const embedCode = `<script src="${widgetUrl}" data-hotel="${hotel.slug}" async><\/script>`;

  const answeredCount = hotel.knowledgeBase.filter((kb) => kb.answer.trim().length > 0).length;

  // Get unread conversation count
  const unreadCount = await prisma.conversation.count({
    where: { hotelId: hotel.id, isRead: false },
  });
  const totalConversations = hotel.conversations.length;

  return (
    <div className="max-w-4xl mx-auto">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-6 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </Link>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">{hotel.name}</h1>
          <p className="text-slate-400 mt-1">/{hotel.slug}</p>
        </div>
        <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-lg text-sm font-medium">
          {hotel.plan}
        </span>
      </div>

      {/* Stats Row */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <StatCard label="Messages" value={hotel.monthlyMsgCount} sub="/ 250 this month" />
        <StatCard label="WA Redirects" value={usage?.waRedirectCount ?? 0} sub="this month" />
        <StatCard label="KB Entries" value={hotel.knowledgeBase.length} sub="total questions" />
        <StatCard label="Answered" value={answeredCount} sub={`of ${hotel.knowledgeBase.length} filled`} />
      </div>

      {/* AI Usage Stats */}
      {aiUsedCount > 0 && (
        <div className="mb-6 bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/30 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-medium text-white">AI Usage (All-Time)</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <p className="text-xs text-slate-400">Total AI Responses</p>
              <p className="text-lg font-bold text-white">{aiUsedCount}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Groq (Primary)</p>
              <p className="text-lg font-bold text-green-400">{groqCount}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">OpenAI (Fallback)</p>
              <p className="text-lg font-bold text-purple-400">{openaiCount}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">KB Matches</p>
              <p className="text-lg font-bold text-blue-400">{kbCount}</p>
            </div>
          </div>
        </div>
      )}

      {/* Usage Bar */}
      <div className="mb-6 bg-slate-800 border border-slate-700 rounded-xl p-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-slate-400">Monthly usage</span>
          <span className="text-white font-medium">{hotel.monthlyMsgCount} / 250</span>
        </div>
        <div className="bg-slate-700 rounded-full h-2">
          <div
            className="bg-blue-500 rounded-full h-2 transition-all"
            style={{ width: `${Math.min((hotel.monthlyMsgCount / 250) * 100, 100)}%` }}
          />
        </div>
      </div>

      {/* AI Test Console Link */}
      <Link
        href={`/dashboard/${hotel.slug}/ai-test`}
        className="mb-6 block bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/30 rounded-xl p-4 hover:border-purple-400 transition"
      >
        <div className="flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-purple-400" />
          <div>
            <h3 className="text-sm font-medium text-white">🤖 AI Test Console</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Test your chatbot's AI responses in real-time (Groq/OpenAI)
            </p>
          </div>
          <ExternalLink className="w-4 h-4 text-slate-400 ml-auto" />
        </div>
      </Link>

      {/* Conversations Link */}
      <Link
        href={`/dashboard/${hotel.slug}/conversations`}
        className="mb-6 block bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-xl p-4 hover:border-cyan-400 transition"
      >
        <div className="flex items-center gap-3">
          <MessageCircle className="w-5 h-5 text-cyan-400" />
          <div className="flex-1">
            <h3 className="text-sm font-medium text-white flex items-center gap-2">
              Conversations
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 bg-amber-500 text-white text-xs rounded-full">
                  {unreadCount} new
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {totalConversations} total conversation{totalConversations !== 1 ? "s" : ""} — View chat logs, guest questions & WA clicks
            </p>
          </div>
          <ExternalLink className="w-4 h-4 text-slate-400 ml-auto" />
        </div>
      </Link>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Hotel Info */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <h3 className="text-sm font-medium text-slate-400 mb-4">Hotel Info</h3>
          <div className="space-y-3 text-sm">
            {hotel.whatsappUrl && (
              <InfoRow label="WhatsApp">
                <a href={hotel.whatsappUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 flex items-center gap-1">
                  Open <ExternalLink className="w-3 h-3" />
                </a>
              </InfoRow>
            )}
            {hotel.website && (
              <InfoRow label="Website">
                <a href={hotel.website} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 flex items-center gap-1">
                  Visit <ExternalLink className="w-3 h-3" />
                </a>
              </InfoRow>
            )}
            {hotel.phone && <InfoRow label="Phone"><span className="text-white">{hotel.phone}</span></InfoRow>}
            {hotel.address && <InfoRow label="Address"><span className="text-white">{hotel.address}</span></InfoRow>}
          </div>
        </div>

        {/* Widget Embed Code */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Code className="w-5 h-5 text-blue-400" />
            <h3 className="text-sm font-medium text-white">Widget Embed Code</h3>
          </div>
          <p className="text-sm text-slate-400 mb-3">
            Paste before &lt;/body&gt; tag on your website.
          </p>
          <div className="bg-slate-900 border border-slate-600 rounded-lg p-3 font-mono text-xs text-emerald-400 break-all">
            {embedCode}
          </div>
          <p className="text-xs text-slate-500 mt-2">
            WordPress, Wix, Squarespace, or any HTML site.
          </p>
        </div>
      </div>

      {/* Knowledge Base Section */}
      <div className="mt-6">
        <KBSection
          slug={hotel.slug}
          entries={hotel.knowledgeBase.map((kb) => ({
            id: kb.id,
            question: kb.question,
            answer: kb.answer,
            category: kb.category,
          }))}
          categories={KB_CATEGORIES}
        />
      </div>
    </div>
  );
}

function StatCard({ label, value, sub }: { label: string; value: number; sub: string }) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-xs text-slate-400 mt-1">{sub}</p>
    </div>
  );
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between">
      <span className="text-slate-400">{label}</span>
      {children}
    </div>
  );
}
