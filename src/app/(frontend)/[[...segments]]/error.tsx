'use client';

// Os error boundaries do Next correm no browser — daí o 'use client'. É exigência
// do framework, não escolha: sem isto o botão de retry não podia existir.

interface ErrorBoundaryProps {
  error: Error & { digest?: string };
  reset: () => void;
}

// Não lhe chames `Error`: sombreia o `Error` global, e a seguir alguém escreve
// `new Error(...)` neste ficheiro sem perceber porque falha.
export default function ErrorBoundary({ error, reset }: ErrorBoundaryProps) {
  return (
    <main>
      <h1>Algo correu mal</h1>

      <p>Não foi possível mostrar esta página. Tenta novamente dentro de momentos.</p>

      {/* O digest é o que permite encontrar o stack trace real nos logs do servidor:
          em produção o Next não envia a mensagem do erro para o browser. */}
      {error.digest ? <p>Referência: {error.digest}</p> : null}

      <button type="button" onClick={reset}>
        Tentar novamente
      </button>
    </main>
  );
}
