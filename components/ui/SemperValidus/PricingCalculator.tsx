'use client';

import { useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';

const PLANS = [
  {
    id: 'recruit',
    name: 'Recruit',
    monthlyPrice: 97,
    tagline: 'The foundation tier',
    features: [
      'Full program access',
      'Performance tracking dashboard',
      'Mobile app access',
      'Weekly progress check-ins',
      'Community membership'
    ]
  },
  {
    id: 'operator',
    name: 'Operator',
    monthlyPrice: 197,
    tagline: 'Most popular',
    popular: true,
    features: [
      'Everything in Recruit',
      '2× monthly coaching calls',
      'Personalized programming',
      'Nutrition strategy guidance',
      'Priority support channel',
      'Advanced analytics'
    ]
  },
  {
    id: 'command',
    name: 'Command',
    monthlyPrice: 497,
    tagline: 'Maximum support',
    features: [
      'Everything in Operator',
      'Unlimited coaching calls',
      'Daily accountability check-ins',
      'VIP community access',
      'Quarterly strategy sessions',
      'Early access to new content'
    ]
  }
] as const;

type PlanId = (typeof PLANS)[number]['id'];

const TEAM_SIZES = [
  { id: 'solo', label: 'Individual', members: 1, discount: 0 },
  { id: 'small', label: 'Small Group', sublabel: '2–5 people', members: 3, discount: 0.1 },
  { id: 'unit', label: 'Unit', sublabel: '6–15 people', members: 10, discount: 0.2 },
  { id: 'large', label: 'Full Command', sublabel: '16+ people', members: 20, discount: 0.3 }
] as const;

type TeamId = (typeof TEAM_SIZES)[number]['id'];

function formatCurrency(cents: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(cents);
}

export default function PricingCalculator() {
  const [selectedPlan, setSelectedPlan] = useState<PlanId>('operator');
  const [teamSize, setTeamSize] = useState<TeamId>('solo');
  const [isAnnual, setIsAnnual] = useState(false);

  const plan = PLANS.find((p) => p.id === selectedPlan)!;
  const team = TEAM_SIZES.find((t) => t.id === teamSize)!;

  const baseMonthly = plan.monthlyPrice;
  const discountedMonthly = baseMonthly * (1 - team.discount);
  const totalMonthly = discountedMonthly * team.members;
  const annualTotal = totalMonthly * 12 * 0.8;
  const annualSavings = totalMonthly * 12 - annualTotal;
  const displayedTotal = isAnnual ? annualTotal / 12 : totalMonthly;

  return (
    <div className="space-y-8">
      {/* Plan selector */}
      <div>
        <p className="text-sv-silver text-sm font-medium mb-3 uppercase tracking-widest">
          1 — Choose Your Plan
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {PLANS.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedPlan(p.id)}
              className={`relative flex flex-col items-start p-4 rounded-xl border text-left transition-all duration-200 ${
                selectedPlan === p.id
                  ? 'bg-sv-card border-sv-gold shadow-lg shadow-sv-gold/10'
                  : 'bg-sv-surface/60 border-sv-border hover:border-sv-gold/40'
              }`}
            >
              {'popular' in p && p.popular && (
                <span className="absolute -top-2.5 left-4 text-[10px] font-bold tracking-widest uppercase bg-sv-gold text-sv-navy px-2.5 py-0.5 rounded-full">
                  Popular
                </span>
              )}
              <span
                className={`text-base font-bold ${selectedPlan === p.id ? 'text-white' : 'text-sv-silver'}`}
              >
                {p.name}
              </span>
              <span
                className={`text-xs mt-0.5 ${selectedPlan === p.id ? 'text-sv-gold' : 'text-sv-muted'}`}
              >
                {formatCurrency(p.monthlyPrice)}/mo
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Team size selector */}
      <div>
        <p className="text-sv-silver text-sm font-medium mb-3 uppercase tracking-widest">
          2 — Team Size
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {TEAM_SIZES.map((t) => (
            <button
              key={t.id}
              onClick={() => setTeamSize(t.id)}
              className={`flex flex-col items-center p-3 rounded-xl border text-center transition-all duration-200 ${
                teamSize === t.id
                  ? 'bg-sv-card border-sv-gold shadow-lg shadow-sv-gold/10'
                  : 'bg-sv-surface/60 border-sv-border hover:border-sv-gold/40'
              }`}
            >
              <span
                className={`text-sm font-semibold ${teamSize === t.id ? 'text-white' : 'text-sv-silver'}`}
              >
                {t.label}
              </span>
              {'sublabel' in t && (
                <span
                  className={`text-[11px] mt-0.5 ${teamSize === t.id ? 'text-sv-gold' : 'text-sv-muted'}`}
                >
                  {t.sublabel}
                </span>
              )}
              {t.discount > 0 && (
                <span className="text-[10px] mt-1 font-bold text-emerald-400">
                  {t.discount * 100}% off
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Billing toggle */}
      <div>
        <p className="text-sv-silver text-sm font-medium mb-3 uppercase tracking-widest">
          3 — Billing Cycle
        </p>
        <div className="inline-flex items-center bg-sv-surface border border-sv-border rounded-xl p-1 gap-1">
          <button
            onClick={() => setIsAnnual(false)}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
              !isAnnual
                ? 'bg-sv-card text-white shadow-sm'
                : 'text-sv-silver hover:text-white'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setIsAnnual(true)}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${
              isAnnual
                ? 'bg-sv-card text-white shadow-sm'
                : 'text-sv-silver hover:text-white'
            }`}
          >
            Annual
            <span className="text-[10px] font-bold tracking-wide text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded-md">
              SAVE 20%
            </span>
          </button>
        </div>
      </div>

      {/* Price summary card */}
      <div className="rounded-2xl border border-sv-gold/30 bg-gradient-to-br from-sv-card to-sv-surface p-6 shadow-xl shadow-sv-gold/5">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
          <div className="space-y-1">
            <p className="text-sv-silver text-sm">
              {plan.name} · {team.label}
              {team.members > 1 ? ` · ${team.members} people` : ''}
            </p>
            <div className="flex items-end gap-2">
              <span className="text-5xl font-black text-white tracking-tight">
                {formatCurrency(Math.round(displayedTotal))}
              </span>
              <span className="text-sv-silver mb-1.5 text-base">/ month</span>
            </div>
            {isAnnual && (
              <p className="text-sv-gold text-sm font-medium">
                Billed {formatCurrency(Math.round(annualTotal))} annually
              </p>
            )}
            {isAnnual && annualSavings > 0 && (
              <p className="text-emerald-400 text-sm font-semibold">
                You save {formatCurrency(Math.round(annualSavings))} per year
              </p>
            )}
            {team.discount > 0 && (
              <p className="text-sv-silver text-xs mt-1">
                {formatCurrency(Math.round(discountedMonthly))}/mo per person
                <span className="text-emerald-400 ml-1">
                  ({team.discount * 100}% team discount applied)
                </span>
              </p>
            )}
          </div>

          <a
            href="/signin/signup"
            className="inline-flex items-center justify-center px-8 py-4 bg-sv-gold text-sv-navy font-bold rounded-xl hover:bg-sv-gold-light active:scale-95 transition-all duration-150 text-sm tracking-wide uppercase whitespace-nowrap"
          >
            Get Started
          </a>
        </div>
      </div>

      {/* Feature list for selected plan */}
      <div className="rounded-2xl border border-sv-border bg-sv-surface/50 p-6">
        <p className="text-white font-semibold mb-4">
          What&apos;s included with {plan.name}
        </p>
        <ul className="space-y-3">
          {plan.features.map((feature) => (
            <li key={feature} className="flex items-center gap-3">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-sv-gold/15 border border-sv-gold/30 flex items-center justify-center">
                <Check className="w-3 h-3 text-sv-gold" strokeWidth={3} />
              </span>
              <span className="text-sv-silver text-sm">{feature}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
