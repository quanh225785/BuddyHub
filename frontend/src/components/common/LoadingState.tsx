type LoadingStateProps = {
  label?: string
  className?: string
}

export function LoadingState({ label = 'Đang tải...', className = '' }: LoadingStateProps) {
  return (
    <div className={`loading-state ${className}`.trim()} role="status" aria-live="polite">
      <span className="loading-spinner" aria-hidden />
      <span>{label}</span>
    </div>
  )
}

export function ButtonSpinner({ label = 'Đang xử lý...' }: { label?: string }) {
  return (
    <span className="button-loading" role="status" aria-live="polite">
      <span className="button-spinner" aria-hidden />
      <span>{label}</span>
    </span>
  )
}
