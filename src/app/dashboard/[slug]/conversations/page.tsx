import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MessageSquare, Phone, Clock, Eye, EyeOff } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ConversationsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const { slug } = await params;

  const hotel = await prisma.hotel.findUnique({
    where: { slug },
    select: { id: true, slug: true, name: true, ownerId: true },
  });

  if (!hotel || hotel.ownerId !== session.user.id) notFound();

  const conversations = await prisma.conversation.findMany({
    where: { hotelId: hotel.id },
    orderBy: { lastMessageAt: "desc" },
    include: {
      messages: {
        select: { id: true, role: true, content: true, waClicked: true, createdAt: true },
      },
    },
  });

  const totalConversations = conversations.length;
  const unreadCount = conversations.filter((c) => !c.isRead).length;

  return (
    <div className="max-w-4xl mx-auto">
      <Link
        href={`/dashboard/${slug}`}
        className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-6 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to {hotel.name}
      </Link>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <MessageSquare className="w-6 h-6 text-blue-400" />
            Conversations
          </h1>
          <p className="text-slate-400 mt-1">
            {totalConversations} conversation{totalConversations !== 1 ? "s" : ""}
            {unreadCount > 0 && (
              <span className="ml-2 text-amber-400">
                ({unreadCount} unread)
              </span>
            )}
          </p>
        </div>
      </div>

      {conversations.length === 0 ? (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-12 text-center">
          <MessageSquare className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No conversations yet</h3>
          <p className="text-slate-400 text-sm">
            When guests send messages through your widget, they'll appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {conversations.map((conv) => {
            const msgCount = conv.messages.length;
            const userMsgCount = conv.messages.filter((m) => m.role === "USER").length;
            const waClickCount = conv.messages.filter((m) => m.waClicked).length;
            const lastMsg = conv.messages[conv.messages.length - 1];
            const lastPreview = lastMsg
              ? lastMsg.content.length > 80
                ? lastMsg.content.slice(0, 80) + "..."
                : lastMsg.content
              : "No messages";

            return (
              <Link
                key={conv.id}
                href={`/dashboard/${slug}/conversations/${conv.sessionId}`}
                className={`block bg-slate-800 border rounded-xl p-4 hover:border-blue-500/50 transition ${
                  conv.isRead ? "border-slate-700" : "border-amber-500/50 bg-slate-800/80"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {!conv.isRead && (
                        <span className="w-2 h-2 bg-amber-400 rounded-full flex-shrink-0" />
                      )}
                      <span className="text-sm font-medium text-white truncate">
                        Session: {conv.sessionId.slice(0, 12)}...
                      </span>
                    </div>
                    <p className="text-sm text-slate-400 truncate">{lastPreview}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 ml-4 flex-shrink-0">
                    <span className="text-xs text-slate-500">
                      {formatDate(conv.lastMessageAt)}
                    </span>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" />
                        {userMsgCount}
                      </span>
                      {waClickCount > 0 && (
                        <span className="flex items-center gap-1 text-green-400">
                          <Phone className="w-3 h-3" />
                          {waClickCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function formatDate(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString();
}
