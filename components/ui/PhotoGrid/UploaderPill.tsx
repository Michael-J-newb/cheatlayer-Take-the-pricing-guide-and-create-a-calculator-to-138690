'use client';

const PILL_COLORS = [
  'bg-rose-900 text-rose-200',
  'bg-sky-900 text-sky-200',
  'bg-emerald-900 text-emerald-200',
  'bg-amber-900 text-amber-200',
  'bg-violet-900 text-violet-200',
  'bg-teal-900 text-teal-200',
  'bg-fuchsia-900 text-fuchsia-200',
  'bg-lime-900 text-lime-200'
];

export function pillColorFor(userId: string) {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash * 31 + userId.charCodeAt(i)) | 0;
  }
  return PILL_COLORS[Math.abs(hash) % PILL_COLORS.length];
}

export default function UploaderPill({
  userId,
  name,
  active,
  onClick
}: {
  userId: string;
  name: string | null;
  active?: boolean;
  onClick?: () => void;
}) {
  const label = name?.trim() || 'Family member';
  return (
    <button
      type="button"
      onClick={onClick}
      title={onClick ? `Show only ${label}'s photos` : label}
      className={`px-2 py-0.5 text-xs font-medium rounded-full whitespace-nowrap ${pillColorFor(
        userId
      )} ${active ? 'ring-2 ring-white' : ''} ${onClick ? 'cursor-pointer' : 'cursor-default'}`}
    >
      {label}
    </button>
  );
}
