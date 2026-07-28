'use client';

import Button from '@/components/ui/Button';
import { createFamily } from '@/utils/family-helpers/server';
import { handleRequest } from '@/utils/auth-helpers/client';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';

export default function CreateFamilyForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    setIsSubmitting(true);
    await handleRequest(e, createFamily, router);
    setIsSubmitting(false);
  };

  return (
    <form noValidate className="mb-4" onSubmit={handleSubmit}>
      <div className="grid gap-2">
        <label htmlFor="name">Family name</label>
        <input
          id="name"
          name="name"
          type="text"
          placeholder="The Newbys"
          autoComplete="off"
          className="w-full p-3 rounded-md bg-zinc-800"
        />
        <Button
          variant="slim"
          type="submit"
          className="mt-1"
          loading={isSubmitting}
        >
          Create family
        </Button>
      </div>
    </form>
  );
}
