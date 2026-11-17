'use client'

import { useFormStatus } from 'react-dom'

interface Props {
  label: string
  loadingLabel?: string
  className?: string
  ariaLabel?: string
}

export default function FormSubmitButton({ label, loadingLabel = 'กำลังดำเนินการ…', className = 'w-full rounded-lg bg-indigo-600 py-3 text-sm font-medium text-white disabled:opacity-50', ariaLabel }: Props) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      aria-label={ariaLabel}
      className={`flex items-center justify-center gap-2 ${className}`}
    >
      {pending && (
        <svg className="animate-spin h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {pending ? loadingLabel : label}
    </button>
  )
}
