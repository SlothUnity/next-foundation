interface ModuleErrorFallbackProps {
  alias: string;
}

export function ModuleErrorFallback({ alias }: ModuleErrorFallbackProps) {
  console.error(process.env.NODE_ENV === 'development');
  if (process.env.NODE_ENV === 'development') {
    return (
      <div>
        <h1>Module Error</h1>
        <p>Failed to load module: {alias}</p>
      </div>
    );
  }

  return null;
}
