import { Component, useEffect, useState, type ReactNode } from 'react';
import { RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';

export function LoadingScreen({ onRetry }: { onRetry: () => void }) {
  const [showRetry, setShowRetry] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowRetry(true), 5000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-6"></div>
      <p className="text-text-muted font-medium">Iniciando sua jornada...</p>

      {showRetry && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 space-y-4"
        >
          <p className="text-sm text-text-muted max-w-xs mx-auto">
            Está demorando mais que o esperado. Isso pode ser devido a uma conexão lenta.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => {
                try {
                  onRetry();
                } catch (e) {
                  console.error('Retry failed:', e);
                }
              }}
              className="text-xs font-bold text-primary hover:underline flex items-center gap-1 justify-center"
            >
              <RefreshCw size={14} />
              Tentar Novamente
            </button>
            <button
              onClick={() => window.location.reload()}
              className="text-xs font-bold text-text-muted hover:underline flex items-center gap-1 justify-center"
            >
              <RefreshCw size={14} />
              Recarregar Página
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}

export class ViewErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; errorMsg: string }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMsg: '' };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, errorMsg: error?.message || String(error) };
  }

  componentDidCatch(error: Error) {
    console.error('View render error:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 px-6">
          <p className="text-xl font-bold">Algo deu errado ao carregar esta tela.</p>
          {this.state.errorMsg && (
            <p className="text-xs text-red-400 bg-red-900/20 border border-red-500/20 rounded-xl px-4 py-2 max-w-sm break-all">{this.state.errorMsg}</p>
          )}
          <button
            onClick={() => { localStorage.clear(); window.location.reload(); }}
            className="bg-primary text-white font-bold px-6 py-3 rounded-2xl text-sm"
          >
            Limpar cache e recarregar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
