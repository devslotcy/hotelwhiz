import Link from "next/link";
import { auth, signOut } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Hotel, LogOut, Plus } from "lucide-react";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Top Nav */}
      <nav className="border-b border-slate-700 bg-slate-800">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between h-16">
          <Link href="/dashboard" className="text-xl font-bold text-white">
            Hotel<span className="text-blue-400">Whiz</span>
            <span className="text-blue-400">.ai</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard/new"
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-lg font-medium transition"
            >
              <Plus className="w-4 h-4" />
              Add Hotel
            </Link>
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-300">
                {session.user.name || session.user.email}
              </span>
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/" });
                }}
              >
                <button
                  type="submit"
                  className="flex items-center gap-1 px-3 py-2 text-sm text-slate-400 hover:text-white transition"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
