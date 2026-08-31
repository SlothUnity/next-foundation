'use client';

interface ErrorBoundaryProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorBoundary({ error, reset }: ErrorBoundaryProps) {
  return (
    <main>
      <h1>Algo correu mal</h1>

      <p>Não foi possível mostrar esta página. Tenta novamente dentro de momentos.</p>

      {error.digest ? <p>Referência: {error.digest}</p> : null}

      <button type="button" onClick={reset}>
        Tentar novamente
      </button>
    </main>
  );
}
