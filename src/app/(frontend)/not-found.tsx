import Link from 'next/link';

export default function NotFound() {
  return (
    <main>
      <h1>Página não encontrada</h1>

      <p>A página que procuras não existe ou foi movida.</p>

      <Link href="/">Voltar à página inicial</Link>
    </main>
  );
}
