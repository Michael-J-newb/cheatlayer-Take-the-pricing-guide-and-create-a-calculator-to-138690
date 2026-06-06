'use client';

import { useState, useEffect, useCallback } from 'react';
import { Database } from '@/types_db';

type Lead = Database['public']['Tables']['leads']['Row'];

const SCORE_BADGE: (score: number | null) => string = (score) => {
  if (score == null) return 'bg-zinc-700 text-zinc-300';
  if (score >= 7) return 'bg-green-700 text-green-100';
  if (score >= 4) return 'bg-yellow-700 text-yellow-100';
  return 'bg-red-800 text-red-100';
};

const DISPOSITION_BADGE: Record<string, string> = {
  missed_window: 'bg-zinc-700 text-zinc-300',
  dismissed: 'bg-zinc-700 text-zinc-300',
  competitor: 'bg-orange-800 text-orange-200',
  not_a_fit: 'bg-zinc-700 text-zinc-300',
  out_of_area: 'bg-zinc-700 text-zinc-300',
  already_booked: 'bg-blue-800 text-blue-200',
  already_messaged: 'bg-green-800 text-green-200',
  no_response: 'bg-zinc-700 text-zinc-300',
  went_elsewhere: 'bg-zinc-700 text-zinc-300',
  duplicate_post: 'bg-zinc-700 text-zinc-300'
};

function ageLabel(createdAt: string): string {
  const diffMs = Date.now() - new Date(createdAt).getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'today';
  if (diffDays === 1) return '1d ago';
  return `${diffDays}d ago`;
}

function truncate(text: string | null, len = 120): string {
  if (!text) return '—';
  return text.length > len ? text.slice(0, len) + '…' : text;
}

interface Props {
  initialLeads: Lead[];
}

export default function LeadsTable({ initialLeads }: Props) {
  const [tab, setTab] = useState<'new' | 'history'>('new');
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchLeads = useCallback(async (t: 'new' | 'history') => {
    setLoading(true);
    setSelected(new Set());
    try {
      const res = await fetch(`/api/leads?tab=${t}`);
      const json = await res.json();
      setLeads(json.leads ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === 'new') {
      setLeads(initialLeads);
      setSelected(new Set());
    } else {
      fetchLeads(tab);
    }
  }, [tab]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === leads.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(leads.map((l) => l.id)));
    }
  };

  const dismissSelected = async () => {
    if (selected.size === 0) return;
    setBulkLoading(true);
    try {
      const ids = Array.from(selected);
      await fetch('/api/leads/bulk-dismiss', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids })
      });
      setLeads((prev) => prev.filter((l) => !selected.has(l.id)));
      setSelected(new Set());
    } catch (err) {
      console.error(err);
    } finally {
      setBulkLoading(false);
    }
  };

  const dismissOne = async (leadId: string) => {
    setActionLoading(leadId);
    try {
      await fetch(`/api/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ disposition: 'dismissed' })
      });
      setLeads((prev) => prev.filter((l) => l.id !== leadId));
      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(leadId);
        return next;
      });
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const allSelected = leads.length > 0 && selected.size === leads.length;
  const someSelected = selected.size > 0 && !allSelected;

  return (
    <div>
      {/* Tab bar */}
      <div className="flex items-center justify-between border-b border-zinc-700 mb-4">
        <div className="flex">
          {(['new', 'history'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-2.5 text-sm font-medium capitalize transition-colors ${
                tab === t
                  ? 'text-white border-b-2 border-white'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {t === 'new' ? 'New Leads' : 'History'}
            </button>
          ))}
        </div>

        {/* Bulk action bar — only visible on new tab with selection */}
        {tab === 'new' && selected.size > 0 && (
          <div className="flex items-center gap-3 pb-2">
            <span className="text-sm text-zinc-400">
              {selected.size} selected
            </span>
            <button
              onClick={dismissSelected}
              disabled={bulkLoading}
              className="px-3 py-1.5 text-sm font-medium bg-zinc-700 hover:bg-zinc-600 text-white rounded transition-colors disabled:opacity-50"
            >
              {bulkLoading ? 'Dismissing…' : `Dismiss Selected (${selected.size})`}
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <p className="text-zinc-400 py-8 text-center">Loading…</p>
      ) : leads.length === 0 ? (
        <p className="text-zinc-500 py-8 text-center">
          {tab === 'new' ? 'No new leads in the last 7 days.' : 'No history yet.'}
        </p>
      ) : tab === 'new' ? (
        // ─── New leads table ───────────────────────────────────────────
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-300">
            <thead className="border-b border-zinc-700 text-zinc-500 text-xs uppercase">
              <tr>
                <th className="py-3 pr-3 w-8">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = someSelected;
                    }}
                    onChange={toggleAll}
                    className="accent-white cursor-pointer"
                  />
                </th>
                <th className="py-3 pr-4">Name</th>
                <th className="py-3 pr-4">Location</th>
                <th className="py-3 pr-4">Post</th>
                <th className="py-3 pr-4">Score</th>
                <th className="py-3 pr-4">Keyword</th>
                <th className="py-3 pr-4">Age</th>
                <th className="py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr
                  key={lead.id}
                  className={`border-b border-zinc-800 transition-colors ${
                    selected.has(lead.id) ? 'bg-zinc-800/60' : 'hover:bg-zinc-900'
                  }`}
                >
                  <td className="py-3 pr-3">
                    <input
                      type="checkbox"
                      checked={selected.has(lead.id)}
                      onChange={() => toggleSelect(lead.id)}
                      className="accent-white cursor-pointer"
                    />
                  </td>
                  <td className="py-3 pr-4 font-medium text-white whitespace-nowrap">
                    {lead.name ?? '—'}
                  </td>
                  <td className="py-3 pr-4 whitespace-nowrap text-zinc-400">
                    {lead.location ?? '—'}
                  </td>
                  <td className="py-3 pr-4 max-w-xs">
                    <span className="line-clamp-2 text-zinc-300">
                      {truncate(lead.post_text)}
                    </span>
                  </td>
                  <td className="py-3 pr-4">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${SCORE_BADGE(lead.score)}`}
                    >
                      {lead.score ?? '—'}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-zinc-400 whitespace-nowrap">
                    {lead.keyword ?? '—'}
                  </td>
                  <td className="py-3 pr-4 whitespace-nowrap text-zinc-500">
                    {ageLabel(lead.created_at)}
                  </td>
                  <td className="py-3">
                    <button
                      onClick={() => dismissOne(lead.id)}
                      disabled={actionLoading === lead.id}
                      className="px-3 py-1 text-xs font-medium bg-zinc-700 hover:bg-zinc-600 text-zinc-200 rounded transition-colors disabled:opacity-40"
                    >
                      {actionLoading === lead.id ? '…' : 'Dismiss'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        // ─── History table ─────────────────────────────────────────────
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-300">
            <thead className="border-b border-zinc-700 text-zinc-500 text-xs uppercase">
              <tr>
                <th className="py-3 pr-4">Name</th>
                <th className="py-3 pr-4">Location</th>
                <th className="py-3 pr-4">Post</th>
                <th className="py-3 pr-4">Score</th>
                <th className="py-3 pr-4">Outcome</th>
                <th className="py-3">Age</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr
                  key={lead.id}
                  className="border-b border-zinc-800 hover:bg-zinc-900"
                >
                  <td className="py-3 pr-4 font-medium text-white whitespace-nowrap">
                    {lead.name ?? '—'}
                  </td>
                  <td className="py-3 pr-4 whitespace-nowrap text-zinc-400">
                    {lead.location ?? '—'}
                  </td>
                  <td className="py-3 pr-4 max-w-xs">
                    <span className="line-clamp-2 text-zinc-400">
                      {truncate(lead.post_text)}
                    </span>
                  </td>
                  <td className="py-3 pr-4">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${SCORE_BADGE(lead.score)}`}
                    >
                      {lead.score ?? '—'}
                    </span>
                  </td>
                  <td className="py-3 pr-4">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-xs font-semibold capitalize ${
                        DISPOSITION_BADGE[lead.disposition ?? ''] ??
                        'bg-zinc-700 text-zinc-300'
                      }`}
                    >
                      {(lead.disposition ?? '').replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="py-3 whitespace-nowrap text-zinc-500">
                    {ageLabel(lead.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
