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
      <path d="M8 6h8l1 3H7l1-3z" />
      <path d="M7 9c-1 0-2 1.5-2 4v5c0 1.5 1 2.5 2.5 2.5h9c1.5 0 2.5-1 2.5-2.5v-5c0-2.5-1-4-2-4" />
      <path d="M10 6V5a2 2 0 0 1 4 0v1" />
      <path d="M9 13h6" />
    </svg>
  );
}
