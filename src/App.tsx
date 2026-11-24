import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import { OfflineIndicator } from './components/OfflineIndicator.tsx';
import { Dashboard } from './pages/Dashboard.tsx';

export default function App() {
  return (
    <ErrorBoundary>
      <Dashboard />
      <OfflineIndicator />
    </ErrorBoundary>
  );
}
