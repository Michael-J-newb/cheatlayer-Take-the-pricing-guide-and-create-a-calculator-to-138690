import PricingCalculator from '@/components/ui/SemperValidus/PricingCalculator';
import { Shield, Target, TrendingUp, Users, ArrowRight } from 'lucide-react';

const PILLARS = [
  {
    icon: Shield,
    title: 'Proven System',
    description:
      'Built on evidence-based methodology refined over years of elite performance coaching. Every decision has a reason.'
  },
  {
    icon: Target,
    title: 'Expert Guidance',
    description:
      'World-class coaches who hold you accountable at every stage. You are never working through this alone.'
  },
  {
    icon: TrendingUp,
    title: 'Measurable Results',
    description:
      'Data-driven tracking ensures your progress is visible, quantified, and consistently moving forward.'
  }
];

const STATS = [
  { value: '94%', label: 'Complete the program' },
  { value: '3.2×', label: 'Average performance gain' },
  { value: '12 wks', label: 'To see real results' },
  { value: '500+', label: 'Alumni worldwide' }
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-sv-navy">
      {/* ─── Nav ──────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-sv-border/60 bg-sv-navy/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-sv-gold flex items-center justify-center">
              <span className="text-sv-navy font-black text-xs tracking-tight">SV</span>
            </div>
            <span className="font-bold text-white tracking-tight">Semper Validus</span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <a
              href="#foundation"
              className="text-sv-silver text-sm hover:text-white transition-colors"
            >
              Foundation
            </a>
            <a
              href="#calculator"
              className="text-sv-silver text-sm hover:text-white transition-colors"
            >
              Pricing
            </a>
          </nav>
          <a
            href="/signin/signup"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-sv-gold text-sv-navy text-sm font-bold rounded-lg hover:bg-sv-gold-light transition-colors"
          >
            Get Started
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </header>

      {/* ─── Hero ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden sv-grid-bg">
        {/* Radial glow */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[600px] h-[600px] rounded-full bg-sv-gold/5 blur-[120px]" />
        </div>

        {/* Top accent line */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-sv-gold/60 to-transparent" />

        <div className="relative max-w-6xl mx-auto px-6 pt-28 pb-36 text-center">
          <div className="inline-flex items-center gap-2 mb-8 px-4 py-1.5 rounded-full border border-sv-gold/25 bg-sv-gold/8">
            <span className="w-1.5 h-1.5 rounded-full bg-sv-gold animate-pulse" />
            <span className="text-sv-gold text-xs font-semibold tracking-[0.25em] uppercase">
              Elite Performance Training
            </span>
          </div>

          <h1 className="text-[clamp(3rem,10vw,6.5rem)] font-black tracking-tighter text-white leading-none mb-6">
            SEMPER
            <br />
            <span className="text-sv-gold">VALIDUS</span>
          </h1>

          <p className="text-lg md:text-xl text-sv-silver max-w-2xl mx-auto leading-relaxed mb-12">
            Not a program — a standard. Engineered for those who demand more of themselves
            and refuse to settle for ordinary.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="#calculator"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-sv-gold text-sv-navy font-bold rounded-xl hover:bg-sv-gold-light active:scale-[0.98] transition-all text-sm tracking-widest uppercase"
            >
              Calculate Investment
              <ArrowRight className="w-4 h-4" />
            </a>
            <a
              href="#foundation"
              className="inline-flex items-center justify-center px-8 py-4 border border-sv-border text-sv-silver font-semibold rounded-xl hover:border-sv-gold/40 hover:text-white transition-all text-sm"
            >
              Learn More
            </a>
          </div>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-sv-navy to-transparent" />
      </section>

      {/* ─── Stats Bar ────────────────────────────────────────── */}
      <section className="border-y border-sv-border bg-sv-surface/40">
        <div className="max-w-6xl mx-auto px-6 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {STATS.map((stat) => (
              <div key={stat.label}>
                <p className="text-3xl md:text-4xl font-black text-sv-gold tracking-tight">
                  {stat.value}
                </p>
                <p className="text-sv-silver text-sm mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Foundation Pillars ───────────────────────────────── */}
      <section id="foundation" className="py-28 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sv-gold text-xs font-semibold tracking-[0.3em] uppercase mb-4">
              Why It Works
            </p>
            <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">
              Built on Three Pillars
            </h2>
            <p className="text-sv-silver mt-4 max-w-xl mx-auto">
              Every element of Semper Validus exists to drive one outcome: lasting, measurable performance.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PILLARS.map((pillar) => {
              const Icon = pillar.icon;
              return (
                <div
                  key={pillar.title}
                  className="group relative p-8 rounded-2xl border border-sv-border bg-sv-surface/60 hover:border-sv-gold/40 hover:bg-sv-card transition-all duration-300"
                >
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-sv-gold/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative">
                    <div className="w-12 h-12 rounded-xl bg-sv-gold/10 border border-sv-gold/20 flex items-center justify-center mb-6">
                      <Icon className="w-5 h-5 text-sv-gold" strokeWidth={1.5} />
                    </div>
                    <h3 className="text-white font-bold text-lg mb-3">{pillar.title}</h3>
                    <p className="text-sv-silver text-sm leading-relaxed">
                      {pillar.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── Pricing Calculator ───────────────────────────────── */}
      <section
        id="calculator"
        className="py-28 px-6 border-t border-sv-border relative overflow-hidden"
      >
        <div className="absolute inset-0 sv-grid-bg opacity-40" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-sv-gold/4 blur-[100px] pointer-events-none" />

        <div className="relative max-w-3xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-sv-gold text-xs font-semibold tracking-[0.3em] uppercase mb-4">
              Pricing Calculator
            </p>
            <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-4">
              Find Your Investment
            </h2>
            <p className="text-sv-silver max-w-lg mx-auto">
              Select your plan, team size, and billing cycle. Your exact cost updates instantly below.
            </p>
          </div>

          <PricingCalculator />
        </div>
      </section>

      {/* ─── Community CTA ────────────────────────────────────── */}
      <section className="py-28 px-6 border-t border-sv-border">
        <div className="max-w-6xl mx-auto">
          <div className="relative rounded-3xl border border-sv-gold/20 bg-gradient-to-br from-sv-card via-sv-surface to-sv-navy p-12 md:p-16 text-center overflow-hidden">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-sv-gold/50 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-sv-gold/20 to-transparent" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-sv-gold/5 blur-[80px]" />
            </div>

            <div className="relative">
              <div className="flex justify-center mb-6">
                <div className="w-14 h-14 rounded-2xl bg-sv-gold/10 border border-sv-gold/25 flex items-center justify-center">
                  <Users className="w-6 h-6 text-sv-gold" strokeWidth={1.5} />
                </div>
              </div>
              <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter mb-4">
                Your strength is earned,<br />
                <span className="text-sv-gold">not given.</span>
              </h2>
              <p className="text-sv-silver max-w-xl mx-auto mb-10 leading-relaxed">
                Join hundreds of individuals who chose to hold themselves to a higher standard.
                The only question is whether you&apos;re ready.
              </p>
              <a
                href="#calculator"
                className="inline-flex items-center gap-2 px-10 py-4 bg-sv-gold text-sv-navy font-bold rounded-xl hover:bg-sv-gold-light active:scale-[0.98] transition-all text-sm tracking-widest uppercase"
              >
                Start Today
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Footer ───────────────────────────────────────────── */}
      <footer className="border-t border-sv-border py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-sv-gold flex items-center justify-center">
              <span className="text-sv-navy font-black text-[10px]">SV</span>
            </div>
            <span className="text-sv-silver text-sm">Semper Validus</span>
          </div>
          <p className="text-sv-muted text-xs">
            © {new Date().getFullYear()} Semper Validus. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
