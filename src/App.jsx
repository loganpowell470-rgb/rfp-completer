import { RfpProvider, useRfp } from './context/RfpContext';
import Header from './components/Header/Header';
import StepIndicator from './components/StepIndicator/StepIndicator';
import StatsBar from './components/StatsBar/StatsBar';
import UploadStep from './components/UploadStep/UploadStep';
import ParseStep from './components/ParseStep/ParseStep';
import GenerateStep from './components/GenerateStep/GenerateStep';
import ReviewStep from './components/ReviewStep/ReviewStep';
import KnowledgeBasePanel from './components/KnowledgeBase/KnowledgeBasePanel';
import styles from './App.module.css';

function AppContent() {
  const { state } = useRfp();

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
    </div>
  );
}

export default function App() {
  return (
    <RfpProvider>
      <AppContent />
    </RfpProvider>
  );
}
