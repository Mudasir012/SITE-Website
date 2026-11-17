// Collegiate shield crest — open book beneath a star, framed by a double rule
export default function AcademicCrest({ className = '' }) {
  return (
    <svg
      viewBox="0 0 40 46"
      fill="none"
      aria-hidden="true"
      className={className}
      strokeLinejoin="round"
    >
      {/* Shield outline */}
      <path
        d="M20 2 36 7v16c0 10-7 16-16 21C11 39 4 33 4 23V7L20 2Z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      {/* Inner shield rule */}
      <path
        d="M20 6.5 32 10.4v12.3c0 7.8-5.4 12.6-12 16.6-6.6-4-12-8.8-12-16.6V10.4L20 6.5Z"
        stroke="currentColor"
        strokeWidth="0.7"
        opacity="0.55"
      />
      {/* Star */}
      <path
        d="M20 10.2l1.1 2.6 2.8.2-2.1 1.9.6 2.8-2.4-1.5-2.4 1.5.6-2.8-2.1-1.9 2.8-.2 1.1-2.6Z"
        fill="currentColor"
        opacity="0.9"
      />
      {/* Open book */}
      <path
        d="M11 20.5c3-1.6 6-1.6 9 .4 3-2 6-2 9-.4v9.4c-3-1.4-6-1.2-9 .7-3-1.9-6-2.1-9-.7v-9.4Z"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      <path d="M20 20.9v9.7" stroke="currentColor" strokeWidth="0.9" />
    </svg>
  );
}
