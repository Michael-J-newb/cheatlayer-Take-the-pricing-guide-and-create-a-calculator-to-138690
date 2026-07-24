'use client';

import { toggleLike } from '@/utils/photo-helpers/server';
import { Heart } from 'lucide-react';
import { useState, useTransition } from 'react';

export default function LikeButton({
  photoId,
  initialCount,
  initialLiked
}: {
  photoId: string;
  initialCount: number;
  initialLiked: boolean;
}) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [, startTransition] = useTransition();

  const onClick = () => {
    // Optimistic flip; server result wins if it disagrees.
    const next = !liked;
    setLiked(next);
    setCount((c) => c + (next ? 1 : -1));
    startTransition(async () => {
      const result = await toggleLike(photoId);
      if (result.liked !== next) {
        setLiked(result.liked);
        setCount((c) => c + (result.liked ? 1 : -1));
      }
    });
  };

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={liked}
      aria-label={liked ? 'Unlike photo' : 'Like photo'}
      className="flex items-center gap-1 text-xs text-zinc-300 hover:text-white"
    >
      <Heart
        size={16}
        className={liked ? 'fill-red-500 text-red-500' : ''}
      />
      {count > 0 && <span>{count}</span>}
    </button>
  );
}
