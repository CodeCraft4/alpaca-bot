import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AppRoutes } from './routes/AppRoutes';
import { TradingProvider } from './context/TradingContext';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <TradingProvider>
        <AppRoutes />
      </TradingProvider>
    </BrowserRouter>
  );
};

export default App;
