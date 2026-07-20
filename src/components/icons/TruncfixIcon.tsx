interface Props {
  size?: number;
  className?: string;
}

/**
 * truncfix icon – document being cleanly split.
 * Optimized to stay legible when rendered in white on a teal background.
 */
export default function TruncfixIcon({ size = 32, className = '' }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Back page */}
      <rect
        x="5"
        y="4"
        width="15"
        height="19"
        rx="2"
        fill="currentColor"
        fillOpacity="0.4"
      />

      {/* Front page */}
      <rect
        x="10"
        y="8"
        width="15"
        height="19"
        rx="2"
        fill="currentColor"
      />

      {/* Dark cut gap so it reads clearly against white pages */}
      <rect
        x="3"
        y="14.5"
        width="26"
        height="3"
        rx="1.5"
        fill="black"
        fillOpacity="0.35"
      />
    </svg>
  );
}
