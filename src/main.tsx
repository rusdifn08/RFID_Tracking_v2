import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import App from './App.tsx'
import ErrorBoundary from './components/ErrorBoundary'

// Setup React Query Client dengan optimasi performa yang lebih agresif
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnMount: false, // Tidak refetch saat component mount jika data sudah ada
      refetchOnReconnect: false, // Tidak refetch saat reconnect
      retry: 1,
      staleTime: 10 * 60 * 1000, // 10 menit - data dianggap fresh lebih lama
      gcTime: 30 * 60 * 1000, // 30 menit - cache dihapus setelah 30 menit (lebih lama)
      throwOnError: false,
      refetchInterval: false,
      // Optimasi untuk mengurangi re-render
      structuralSharing: true,
      // Network mode untuk optimasi
      networkMode: 'online',
    },
    mutations: {
      throwOnError: false,
      retry: 1,
      networkMode: 'online',
    },
  },
})

// Error handler global untuk menangkap error yang tidak tertangkap
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>,
)
