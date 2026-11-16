'use client'

interface Props {
  pending: boolean
  label: string
  loadingLabel?: string
  className?: string
}

export default function SubmitButton({
  pending,
  label,
  loadingLabel = 'กำลังบันทึก…',
  className = 'w-full rounded-lg bg-indigo-600 py-3 text-sm font-medium text-white disabled:opacity-50',
}: Props) {
  return (
    <button
      type="submit"
      disabled={pending}
      className={`${className} flex items-center justify-center gap-2`}
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
