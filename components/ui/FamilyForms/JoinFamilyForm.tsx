'use client';

import Button from '@/components/ui/Button';
import { joinFamilyByCode } from '@/utils/family-helpers/server';
import { handleRequest } from '@/utils/auth-helpers/client';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';

export default function JoinFamilyForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    setIsSubmitting(true);
    await handleRequest(e, joinFamilyByCode, router);
    setIsSubmitting(false);
  };

  return (
    <form noValidate className="mb-4" onSubmit={handleSubmit}>
      <div className="grid gap-2">
        <label htmlFor="code">Invite code</label>
        <input
          id="code"
          name="code"
          type="text"
          placeholder="ABCD2345"
          autoComplete="off"
          autoCapitalize="characters"
          className="w-full p-3 tracking-widest uppercase rounded-md bg-zinc-800"
        />
        <Button
          variant="slim"
          type="submit"
          className="mt-1"
          loading={isSubmitting}
        >
          Join family
        </Button>
      </div>
    </form>
  );
}
