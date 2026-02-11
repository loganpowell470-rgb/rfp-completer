import { useEffect, useRef } from 'react';
import { RfpProvider, useRfp } from './context/RfpContext';
import { ToastProvider } from './context/ToastContext';
import Header from './components/Header/Header';
import StepIndicator from './components/StepIndicator/StepIndicator';
import StatsBar from './components/StatsBar/StatsBar';
import UploadStep from './components/UploadStep/UploadStep';
import ParseStep from './components/ParseStep/ParseStep';
import GenerateStep from './components/GenerateStep/GenerateStep';
import ReviewStep from './components/ReviewStep/ReviewStep';
import KnowledgeBasePanel from './components/KnowledgeBase/KnowledgeBasePanel';
import Toast from './components/common/Toast';
import styles from './App.module.css';

function AppContent() {
  const { state } = useRfp();
  const prevStep = useRef(state.currentStep);

  // Scroll to top on step transitions
  useEffect(() => {
    if (prevStep.current !== state.currentStep) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      prevStep.current = state.currentStep;
    }
  }, [state.currentStep]);

  const renderStep = () => {
    switch (state.currentStep) {
      case 0: return <UploadStep />;
      case 1: return <ParseStep />;
      case 2: return <GenerateStep />;
      case 3: return <ReviewStep />;
      default: return <UploadStep />;
    }
  };

  return (
    <div className={styles.app}>
      <Header />
      <StepIndicator currentStep={state.currentStep} />
      <main className={styles.main}>
        {renderStep()}
      </main>
      <StatsBar />
      <KnowledgeBasePanel />
      <Toast />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <RfpProvider>
        <AppContent />
      </RfpProvider>
    </ToastProvider>
  );
}
