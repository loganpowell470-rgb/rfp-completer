import { createContext, useContext } from 'react';
import { useRfpWorkflow } from '../hooks/useRfpWorkflow';

const RfpContext = createContext(null);

export function RfpProvider({ children }) {
  const workflow = useRfpWorkflow();
  return (
    <RfpContext.Provider value={workflow}>
      {children}
    </RfpContext.Provider>
  );
}

export function useRfp() {
  const context = useContext(RfpContext);
  if (!context) {
    throw new Error('useRfp must be used within an RfpProvider');
  }
  return context;
}
