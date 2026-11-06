import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AppRoutes } from './routes/AppRoutes';
import { TradingProvider } from './context/TradingContext';
import { ErrorBoundary } from './components/ErrorBoundary';

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <TradingProvider>
          <AppRoutes />
        </TradingProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
};

export default App;
