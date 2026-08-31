'use client';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  return (
    <html lang="pt-PT">
      <body>
        <main>
          <h1>Algo correu mal</h1>

          <p>Não foi possível mostrar esta página. Tenta novamente dentro de momentos.</p>

          {error.digest ? <p>Referência: {error.digest}</p> : null}

          <button type="button" onClick={reset}>
            Tentar novamente
          </button>
        </main>
      </body>
    </html>
  );
}
