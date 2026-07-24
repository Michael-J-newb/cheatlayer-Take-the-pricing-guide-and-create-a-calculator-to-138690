'use client';

import Button from '@/components/ui/Button';
import { createTimeline } from '@/utils/timeline-helpers/server';
import { handleRequest } from '@/utils/auth-helpers/client';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';

export default function CreateTimelineForm({
  familyId
}: {
  familyId: string;
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    setIsSubmitting(true);
    await handleRequest(e, createTimeline, router);
    setIsSubmitting(false);
  };

  return (
    <form noValidate className="mb-4" onSubmit={handleSubmit}>
      <input type="hidden" name="familyId" value={familyId} />
      <div className="grid gap-2">
        <label htmlFor="name">Trip or event name</label>
        <input
          id="name"
          name="name"
          type="text"
          placeholder="Summer 2026"
          autoComplete="off"
          className="w-full p-3 rounded-md bg-zinc-800"
        />
        <Button
          variant="slim"
          type="submit"
          className="mt-1"
          loading={isSubmitting}
        >
          Create timeline
        </Button>
      </div>
    </form>
  );
}
