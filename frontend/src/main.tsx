import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import { AppProvider } from './context/AppContext';
import './index.css';
const client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: 30_000, refetchOnWindowFocus: false } } });
createRoot(document.getElementById('root')!).render(
  <StrictMode><QueryClientProvider client={client}><BrowserRouter><AppProvider><App/></AppProvider></BrowserRouter></QueryClientProvider></StrictMode>
);
