/**
 * VitalSeal mark: a hexagonal seal crossed by a pulse line. Original artwork;
 * deliberately unrelated to any agency or mission insignia.
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" aria-hidden="true" className={className}>
      <path
        d="M20 3.5 33.5 11.25v15.5L20 34.5 6.5 26.75v-15.5Z"
        fill="rgb(92 200 240 / 0.12)"
        stroke="var(--color-ice-300)"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M20 8 29.6 13.5v11L20 30l-9.6-5.5v-11Z"
        fill="none"
        stroke="var(--color-ice-400)"
        strokeWidth="0.8"
        strokeDasharray="1.5 2.5"
        opacity="0.8"
      />
      <path
        d="M9.5 20h5l2.2-5.2 3.6 10.4 2.6-7 1.3 1.8h6.3"
        fill="none"
        stroke="var(--color-ember-300)"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
