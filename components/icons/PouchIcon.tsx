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
      <path d="M8 4.5c0-1 1.5-2 4-2s4 1 4 2" />
      <path d="M7 4.5h10" />
      <path d="M9 3.5c.8-.8 1.7-.8 2.5 0s1.7.8 2.5 0" />
      <path d="M7.5 7c-1.2 0-2 1.2-2 3.5v6.5c0 1.4 1.1 2.5 2.5 2.5h8c1.4 0 2.5-1.1 2.5-2.5v-6.5c0-2.3-.8-3.5-2-3.5" />
      <path d="M9 7h6" />
      <path d="M12 11v4" />
    </svg>
  );
}
