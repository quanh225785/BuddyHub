type StepIndicatorProps = {
  currentStep: number // 1, 2, or 3
  totalSteps?: number
}

export function StepIndicator({ currentStep, totalSteps = 3 }: StepIndicatorProps) {
  return (
    <div className="step-indicator">
      <div className="step-indicator-track">
        {Array.from({ length: totalSteps - 1 }, (_, index) => (
          <div
            key={`line-${index}`}
            className={`step-indicator-line ${currentStep > index + 1 ? 'is-completed' : ''}`}
          />
        ))}
      </div>

      <div className="step-indicator-items">
        {Array.from({ length: totalSteps }, (_, index) => (
          <div key={index + 1} className={`step-indicator-item ${currentStep === index + 1 ? 'is-active' : ''} ${currentStep > index + 1 ? 'is-completed' : ''}`}>
            <div className="step-indicator-circle">
              {currentStep > index + 1 ? (
                <svg className="step-check-icon" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              ) : (
                index + 1
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
