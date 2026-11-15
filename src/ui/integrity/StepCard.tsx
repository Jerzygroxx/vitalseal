import type { ReactNode } from 'react'

export interface StepCardProps {
  /** 1-based step number, shown in the round badge. */
  step: number
  title: string
  /** Extra classes for the card (grid placement, padding overrides). */
  className?: string
  children: ReactNode
}

/**
 * Numbered step card shared by the Integrity and Ground Control tabs (T-08):
 * a big number, a short title and the content of the step.
 */
export function StepCard({ step, title, className = '', children }: StepCardProps) {
  return (
    <section aria-label={`Step ${step}: ${title}`} className={`glass flex flex-col p-4 sm:p-5 ${className}`}>
      <h3 className="flex items-center gap-3">
        <span aria-hidden="true" className="ig-step-num num">
          {step}
        </span>
        <span className="font-display text-xl leading-7 font-semibold text-fg sm:text-[1.375rem]">
          {title}
        </span>
      </h3>
      <div className="mt-3 flex flex-1 flex-col">{children}</div>
    </section>
  )
}
