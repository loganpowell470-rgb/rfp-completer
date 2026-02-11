import { STEPS } from '../../utils/constants';
import Icon from '../common/Icon';
import styles from './StepIndicator.module.css';

export default function StepIndicator({ currentStep }) {
  return (
    <div className={styles.container}>
      <div className={styles.steps}>
        {STEPS.map((step, i) => {
          const isCompleted = currentStep > step.id;
          const isActive = currentStep === step.id;
          const isUpcoming = currentStep < step.id;

          return (
            <div key={step.id} className={styles.stepWrapper}>
              {i > 0 && (
                <div className={`${styles.connector} ${isCompleted || isActive ? styles.connectorActive : ''}`} />
              )}
              <div className={`${styles.step} ${isCompleted ? styles.completed : ''} ${isActive ? styles.active : ''} ${isUpcoming ? styles.upcoming : ''}`}>
                <div className={styles.circle}>
                  {isCompleted ? (
                    <Icon name="check" size={14} />
                  ) : (
                    <span className={styles.number}>{step.id + 1}</span>
                  )}
                </div>
                <span className={styles.label}>{step.label}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
