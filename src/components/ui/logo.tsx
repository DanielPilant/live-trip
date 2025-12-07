export function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 128 128"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      suppressHydrationWarning
    >
      <path
        d="M64 120C64 120 112 82.5 112 51.5C112 24.16 89.6 2 64 2C38.4 2 16 24.16 16 51.5C16 82.5 64 120 64 120Z"
        fill="#AEE64F"
        suppressHydrationWarning
      />
      <circle cx="64" cy="51.5" r="13.5" fill="white" suppressHydrationWarning />
    </svg>
  );
}
