import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Hotel, MessageSquare, Plus, ExternalLink } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const hotels = await prisma.hotel.findMany({
    where: { ownerId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">My Hotels</h1>
          <p className="text-slate-400 mt-1">
            Manage your hotels and chat widgets
          </p>
        </div>
      </div>

      {hotels.length === 0 ? (
        <div className="text-center py-20 bg-slate-800 border border-slate-700 rounded-xl">
          <Hotel className="w-12 h-12 text-slate-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">
            No hotels yet
          </h3>
          <p className="text-slate-400 mb-6">
            Add your first hotel to get started with AI chat widget
          </p>
          <Link
            href="/dashboard/new"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition"
          >
            <Plus className="w-5 h-5" />
            Add Your First Hotel
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {hotels.map((hotel) => (
            <Link
              key={hotel.id}
              href={`/dashboard/${hotel.slug}`}
              className="block bg-slate-800 border border-slate-700 rounded-xl p-6 hover:border-blue-500/40 transition group"
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-lg font-semibold text-white group-hover:text-blue-400 transition">
                  {hotel.name}
                </h3>
                <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-blue-400 transition" />
              </div>
              <p className="text-sm text-slate-400 mb-4">
                /{hotel.slug}
              </p>
              <div className="flex items-center gap-4 text-sm text-slate-500">
                <span className="flex items-center gap-1">
                  <MessageSquare className="w-4 h-4" />
                  {hotel.monthlyMsgCount} / 250 msgs
                </span>
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded text-xs font-medium">
                  {hotel.plan}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
