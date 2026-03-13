import Link from "next/link";
import { MessageSquare, Zap, Globe } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <div className="text-2xl font-bold tracking-tight">
          Hotel<span className="text-blue-400">Whiz</span>
          <span className="text-blue-400">.ai</span>
        </div>
        <div className="flex gap-3">
          <Link
            href="/auth/login"
            className="px-4 py-2 text-sm rounded-lg border border-white/20 hover:bg-white/10 transition"
          >
            Login
          </Link>
          <Link
            href="/auth/signup"
            className="px-4 py-2 text-sm rounded-lg bg-blue-500 hover:bg-blue-600 transition font-medium"
          >
            Get Started Free
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-24 pb-16 text-center">
        <div className="inline-block px-3 py-1 mb-6 text-xs font-medium bg-blue-500/20 text-blue-300 rounded-full border border-blue-500/30">
          AI-Powered Hotel Chat Widget
        </div>
        <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-6">
          Turn website visitors into{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
            direct bookings
          </span>
        </h1>
        <p className="text-lg text-slate-300 max-w-2xl mx-auto mb-10">
          AI chat widget that answers guest questions 24/7 and redirects them to
          WhatsApp for direct reservations. Skip OTA commissions, keep more
          revenue.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link
            href="/auth/signup"
            className="px-8 py-3 bg-blue-500 hover:bg-blue-600 rounded-xl font-semibold transition text-lg"
          >
            Start Free — 250 msgs/month
          </Link>
          <Link
            href="#features"
            className="px-8 py-3 border border-white/20 hover:bg-white/10 rounded-xl font-semibold transition text-lg"
          >
            See How It Works
          </Link>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-5xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">
          Everything you need to boost direct bookings
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          <FeatureCard
            icon={<MessageSquare className="w-8 h-8 text-blue-400" />}
            title="AI Chat Widget"
            description="Embed on any website (WordPress, Wix, HTML). Answers guest questions instantly using your hotel's knowledge base."
          />
          <FeatureCard
            icon={<Zap className="w-8 h-8 text-cyan-400" />}
            title="WhatsApp Redirect"
            description="Detects booking intent and redirects guests to WhatsApp for direct reservation. No OTA commissions."
          />
          <FeatureCard
            icon={<Globe className="w-8 h-8 text-emerald-400" />}
            title="Easy Setup"
            description="Add your hotel info, get a single script tag. Works everywhere — no coding required. Live in 5 minutes."
          />
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-3xl mx-auto px-6 py-16 text-center">
        <div className="bg-gradient-to-r from-blue-600/20 to-cyan-600/20 border border-blue-500/30 rounded-2xl p-12">
          <h3 className="text-3xl font-bold mb-4">
            Ready to save on OTA commissions?
          </h3>
          <p className="text-slate-300 mb-8">
            Free plan includes 250 messages/month. No credit card required.
          </p>
          <Link
            href="/auth/signup"
            className="inline-block px-8 py-3 bg-blue-500 hover:bg-blue-600 rounded-xl font-semibold transition text-lg"
          >
            Create Your Free Account
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 mt-12">
        <div className="max-w-6xl mx-auto px-6 py-8 flex justify-between items-center text-sm text-slate-400">
          <span>HotelWhiz.ai — AI Chat for Hotels</span>
          <span>Made for Phuket Hotels</span>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-6 hover:border-blue-500/40 transition">
      <div className="mb-4">{icon}</div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-slate-400 text-sm leading-relaxed">{description}</p>
    </div>
  );
}
