import { useState } from 'react';
import styles from './Wizard.module.css';

/**
 * Wizard — a multi-step flow: a step indicator (numbered circles + labels,
 * connected by a progress line) above whichever step's content the caller
 * renders, with Back/Next/Submit controls below it. Named `Wizard` here
 * rather than `Stepper` (TASKS.md's Task 2.20 calls it "`Stepper/Wizard`",
 * either name) specifically to avoid clashing with `QuantityStepper`
 * (Task 2.9) — a completely different, already-shipped "−/number/+"
 * component that also has "Stepper" in its name.
 *
 * The one concrete named use in the spec is Task 4.4, "Request Live:
 * payment screenshot upload step (`Stepper/Wizard`)" — ROADMAP.md's own
 * phrasing for that flow is "registration fee + NATRA payment info
 * display → upload payment screenshot", i.e. a 2-step wizard (view fee/
 * payment info, then upload the screenshot) sitting in front of Task
 * 4.5's actual submit endpoint. The customer Order Builder flow (Phase 3,
 * `docs/NATRA_MASTER_PROMPT.md`'s "Order Builder" through "Submit") is
 * also several screens in sequence, but TASKS.md tags none of those
 * tasks (3.10–3.16) with `Stepper/Wizard` the way it tags 4.4 — so that
 * flow is presumably meant to stay ordinary full-screen React Router
 * navigation, not this component, and this component isn't built
 * assuming otherwise.
 *
 * `steps` is metadata only (`{ key, label }[]`) for the indicator —
 * exactly like `RoleShell`'s nav items, this component doesn't own or
 * render any step's actual content itself (unlike e.g. `ListWithPagination`
 * needing `renderItem`, there's no shared shape across "payment info" vs
 * "upload a file" worth templating). `children` is a function,
 * `(activeStep) => ReactNode`, so only the active step's content is
 * mounted at a time — the same reasoning `ImageViewer`'s overlay is
 * portal-rendered only while open, not kept mounted-but-hidden.
 *
 * "With state" (TASKS.md's own phrase for this task, unlike `Stepper`
 * without that phrase in 2.9's `QuantityStepper`) is why this manages
 * `activeStep` internally via `useState` by default, rather than being
 * fully controlled the way `QuantityStepper`/`ToggleSwitch` are — a
 * wizard's navigation (which step is active) is usually not state the
 * caller has any independent reason to own or reset externally. An
 * `onStepChange(index)` callback still fires on every change for a
 * caller that wants to observe or log progress, without requiring it to
 * hold the index itself.
 *
 * Per-step validation (should "Next" even be allowed to fire yet) is
 * deliberately NOT built in — `isNextDisabled` is a plain boolean the
 * caller passes in for the *current* step, recomputed on every render
 * from whatever form state that step owns (e.g. "has a screenshot file
 * been selected"). A validation-rules mini-framework isn't something any
 * named task actually asks for yet, and guessing one now risks fighting
 * whatever Task 4.4 actually needs once real form fields exist.
 */
export default function Wizard({
  steps,
  initialStep = 0,
  onStepChange,
  onComplete,
  isNextDisabled = false,
  nextLabel = 'Next',
  backLabel = 'Back',
  completeLabel = 'Submit',
  children,
  className,
}) {
  const [activeStep, setActiveStep] = useState(initialStep);

  const isFirstStep = activeStep === 0;
  const isLastStep = activeStep === steps.length - 1;

  const goTo = (index) => {
    setActiveStep(index);
    onStepChange?.(index);
  };

  const handleBack = () => {
    if (!isFirstStep) goTo(activeStep - 1);
  };

  const handleNext = () => {
    if (isNextDisabled) return;
    if (isLastStep) {
      onComplete?.();
    } else {
      goTo(activeStep + 1);
    }
  };

  return (
    <div className={[styles.wizard, className].filter(Boolean).join(' ')}>
      <ol className={styles.indicator} aria-label="Progress">
        {steps.map((step, index) => {
          const isActive = index === activeStep;
          const isComplete = index < activeStep;

          return (
            <li key={step.key} className={styles.indicatorItem}>
              <span
                className={[
                  styles.indicatorCircle,
                  isActive ? styles.indicatorCircleActive : null,
                  isComplete ? styles.indicatorCircleComplete : null,
                ]
                  .filter(Boolean)
                  .join(' ')}
                aria-current={isActive ? 'step' : undefined}
              >
                {isComplete ? '✓' : index + 1}
              </span>
              <span className={styles.indicatorLabel}>{step.label}</span>

              {index < steps.length - 1 && (
                <span
                  className={[
                    styles.indicatorLine,
                    isComplete ? styles.indicatorLineComplete : null,
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  aria-hidden="true"
                />
              )}
            </li>
          );
        })}
      </ol>

      <div className={styles.stepContent}>{children(activeStep)}</div>

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.backButton}
          onClick={handleBack}
          disabled={isFirstStep}
        >
          {backLabel}
        </button>

        <button
          type="button"
          className={styles.nextButton}
          onClick={handleNext}
          disabled={isNextDisabled}
        >
          {isLastStep ? completeLabel : nextLabel}
        </button>
      </div>
    </div>
  );
}
