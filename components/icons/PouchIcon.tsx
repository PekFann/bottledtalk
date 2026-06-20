type Props = {
  className?: string;
};

export default function PouchIcon({ className = "h-5 w-5" }: Props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M9 4c0-1.5 1.5-2.5 3-2.5s3 1 3 2.5" />
      <path d="M8 4h8" />
      <path d="M7.5 6.5c-1.2.3-2 1.5-2 3.5v5.5c0 2.2 2 4 4.5 4.5s4.5-2.3 4.5-4.5V10c0-2-0.8-3.2-2-3.5" />
      <circle cx="12" cy="14" r="2.25" />
      <path d="M12 12.2v1.6" />
    </svg>
  );
}
