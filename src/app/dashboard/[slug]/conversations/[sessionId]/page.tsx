import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  MessageSquare,
  Bot,
  User,
  Phone,
  ExternalLink,
  Globe,
  Clock,
  Cpu,
  MousePointerClick,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ConversationDetailPage({
  params,
}: {
  params: Promise<{ slug: string; sessionId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const { slug, sessionId } = await params;

  const hotel = await prisma.hotel.findUnique({
    where: { slug },
    select: { id: true, slug: true, name: true, ownerId: true, whatsappUrl: true },
  });

  if (!hotel || hotel.ownerId !== session.user.id) notFound();

  const conversation = await prisma.conversation.findFirst({
    where: { hotelId: hotel.id, sessionId },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!conversation) notFound();

  // Mark as read
  if (!conversation.isRead) {
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { isRead: true },
    });
  }

  const userMessages = conversation.messages.filter((m) => m.role === "USER");
  const waClicks = conversation.messages.filter((m) => m.waClicked).length;

  // Build WhatsApp reply link
  const waReplyUrl = hotel.whatsappUrl
    ? `${hotel.whatsappUrl}${hotel.whatsappUrl.includes("?") ? "&" : "?"}text=${encodeURIComponent(
        `Merhaba! Widget üzerinden gelen sorunuzla ilgili size yardımcı olmak istiyorum.`
      )}`
    : null;

  return (
    <div className="max-w-4xl mx-auto">
      <Link
        href={`/dashboard/${slug}/conversations`}
        className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-6 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Conversations
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-400" />
            Conversation Detail
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Session: {sessionId}
          </p>
        </div>
        {waReplyUrl && (
          <a
            href={waReplyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg font-medium transition"
          >
            <Phone className="w-4 h-4" />
            WhatsApp'ta Cevap Ver
          </a>
        )}
      </div>

      {/* Conversation Info */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <InfoCard
          icon={<MessageSquare className="w-4 h-4 text-blue-400" />}
          label="Messages"
          value={`${conversation.messages.length}`}
        />
        <InfoCard
          icon={<User className="w-4 h-4 text-cyan-400" />}
          label="Guest Questions"
          value={`${userMessages.length}`}
        />
        <InfoCard
          icon={<MousePointerClick className="w-4 h-4 text-green-400" />}
          label="WA Clicks"
          value={`${waClicks}`}
        />
        <InfoCard
          icon={<Clock className="w-4 h-4 text-amber-400" />}
          label="Started"
          value={formatTime(conversation.startedAt)}
        />
      </div>

      {conversation.sourceUrl && (
        <div className="mb-6 flex items-center gap-2 text-sm text-slate-400 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2">
          <Globe className="w-4 h-4" />
          Source: <span className="text-white">{conversation.sourceUrl}</span>
        </div>
      )}

      {/* Chat Log */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-700">
          <h3 className="text-sm font-medium text-white">Chat Log</h3>
        </div>
        <div className="divide-y divide-slate-700/50">
          {conversation.messages.map((msg) => (
            <div
              key={msg.id}
              className={`p-4 ${
                msg.role === "USER" ? "bg-slate-800" : "bg-slate-800/50"
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    msg.role === "USER"
                      ? "bg-cyan-500/20 text-cyan-400"
                      : "bg-purple-500/20 text-purple-400"
                  }`}
                >
                  {msg.role === "USER" ? (
                    <User className="w-4 h-4" />
                  ) : (
                    <Bot className="w-4 h-4" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-white">
                      {msg.role === "USER" ? "Guest" : "AI Assistant"}
                    </span>
                    <span className="text-xs text-slate-500">
                      {formatTimeFull(msg.createdAt)}
                    </span>
                    {msg.modelUsed && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-700 text-xs rounded-full text-slate-300">
                        <Cpu className="w-3 h-3" />
                        {msg.modelUsed}
                      </span>
                    )}
                    {msg.intent && (
                      <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded-full">
                        {msg.intent}
                      </span>
                    )}
                    {msg.waClicked && (
                      <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        WA clicked
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-300 whitespace-pre-wrap">
                    {msg.content}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function InfoCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-3">
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="text-xs text-slate-400">{label}</span>
      </div>
      <p className="text-lg font-bold text-white">{value}</p>
    </div>
  );
}

function formatTime(date: Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatTimeFull(date: Date): string {
  return new Date(date).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}
