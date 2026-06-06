'use client';

import { useState, useEffect, useCallback } from 'react';
import Button from '@/components/ui/Button';
import { Database } from '@/types_db';

type LeadStatus = Database['public']['Enums']['lead_status'];
type Lead = Database['public']['Tables']['nextdoor_leads']['Row'];

const TABS: { label: string; value: LeadStatus }[] = [
  { label: 'New', value: 'new' },
  { label: 'Contacted', value: 'contacted' },
  { label: 'Dismissed', value: 'dismissed' }
];

const STATUS_BADGE: Record<LeadStatus, string> = {
  new: 'bg-blue-600 text-white',
  contacted: 'bg-green-700 text-white',
  dismissed: 'bg-zinc-600 text-zinc-300'
};

interface Props {
  initialLeads: Lead[];
}

export default function LeadsTable({ initialLeads }: Props) {
  const [activeTab, setActiveTab] = useState<LeadStatus>('new');
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchLeads = useCallback(async (status: LeadStatus) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/leads?status=${status}`);
      const json = await res.json();
      setLeads(json.leads ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'new') {
      setLeads(initialLeads);
    } else {
      fetchLeads(activeTab);
    }
  }, [activeTab]);

  const updateStatus = async (leadId: string, newStatus: LeadStatus) => {
    setActionLoading(leadId);
    try {
      await fetch(`/api/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      setLeads((prev) => prev.filter((l) => l.id !== leadId));
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div>
      <div className="flex space-x-1 border-b border-zinc-700 mb-6">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.value
                ? 'text-white border-b-2 border-white'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-zinc-400">Loading...</p>
      ) : leads.length === 0 ? (
        <p className="text-zinc-400">No {activeTab} leads.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-300">
            <thead className="border-b border-zinc-700 text-zinc-500 uppercase text-xs">
              <tr>
                <th className="py-3 pr-4">Poster</th>
                <th className="py-3 pr-4">Post Snippet</th>
                <th className="py-3 pr-4">Neighborhood</th>
                <th className="py-3 pr-4">First Seen</th>
                <th className="py-3 pr-4">Status</th>
                <th className="py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr
                  key={lead.id}
                  className="border-b border-zinc-800 hover:bg-zinc-900"
                >
                  <td className="py-3 pr-4 font-medium text-white">
                    {lead.poster_name ?? lead.poster_id}
                  </td>
                  <td className="py-3 pr-4 max-w-xs truncate">
                    {lead.post_snippet ?? '—'}
                  </td>
                  <td className="py-3 pr-4">{lead.neighborhood ?? '—'}</td>
                  <td className="py-3 pr-4 whitespace-nowrap">
                    {new Date(lead.first_seen_at).toLocaleDateString()}
                  </td>
                  <td className="py-3 pr-4">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${STATUS_BADGE[lead.status]}`}
                    >
                      {lead.status}
                    </span>
                  </td>
                  <td className="py-3 flex gap-2">
                    {lead.status !== 'contacted' && (
                      <Button
                        variant="slim"
                        loading={actionLoading === lead.id}
                        onClick={() => updateStatus(lead.id, 'contacted')}
                      >
                        Contact
                      </Button>
                    )}
                    {lead.status !== 'dismissed' && (
                      <Button
                        variant="slim"
                        loading={actionLoading === lead.id}
                        onClick={() => updateStatus(lead.id, 'dismissed')}
                      >
                        Dismiss
                      </Button>
                    )}
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
