'use client';

import Button from '@/components/ui/Button';
import {
  generateInviteCode,
  revokeInviteCode
} from '@/utils/family-helpers/server';
import { handleRequest } from '@/utils/auth-helpers/client';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';

interface InviteCodeManagerProps {
  familyId: string;
  activeCode: string | null;
  expiresAt: string | null;
}

export default function InviteCodeManager({
  familyId,
  activeCode,
  expiresAt
}: InviteCodeManagerProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  const submit = async (
    e: React.FormEvent<HTMLFormElement>,
    action: (formData: FormData) => Promise<string>
  ) => {
    setIsSubmitting(true);
    await handleRequest(e, action, router);
    setIsSubmitting(false);
  };

  const copyCode = async () => {
    if (!activeCode) return;
    await navigator.clipboard.writeText(activeCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-6 border rounded-lg border-zinc-700">
      <h2 className="text-lg font-semibold text-white">Invite code</h2>
      {activeCode ? (
        <div className="mt-3">
          <div className="flex items-center gap-3">
            <code className="px-4 py-2 text-xl tracking-widest rounded bg-zinc-800 text-white">
              {activeCode}
            </code>
            <button
              type="button"
              onClick={copyCode}
              className="text-sm text-zinc-300 hover:text-white"
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          {expiresAt && (
            <p className="mt-2 text-sm text-zinc-400">
              Anyone with this code can join until{' '}
              {new Date(expiresAt).toLocaleDateString()}.
            </p>
          )}
          <div className="flex gap-3 mt-4">
            <form onSubmit={(e) => submit(e, generateInviteCode)}>
              <input type="hidden" name="familyId" value={familyId} />
              <Button variant="slim" type="submit" loading={isSubmitting}>
                Generate new code
              </Button>
            </form>
            <form onSubmit={(e) => submit(e, revokeInviteCode)}>
              <input type="hidden" name="familyId" value={familyId} />
              <Button variant="slim" type="submit" loading={isSubmitting}>
                Revoke
              </Button>
            </form>
          </div>
        </div>
      ) : (
        <div className="mt-3">
          <p className="text-sm text-zinc-400">
            No active code. Generate one and text it to the family.
          </p>
          <form
            className="mt-4"
            onSubmit={(e) => submit(e, generateInviteCode)}
          >
            <input type="hidden" name="familyId" value={familyId} />
            <Button variant="slim" type="submit" loading={isSubmitting}>
              Generate invite code
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}
