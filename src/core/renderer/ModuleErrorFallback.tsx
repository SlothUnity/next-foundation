interface ModuleErrorFallbackProps {
  alias: string;
}

export function ModuleErrorFallback({ alias }: ModuleErrorFallbackProps) {
  if (process.env.NODE_ENV === 'development') {
    return (
      <div>
        <p>
          <strong>Module Error</strong>
        </p>

        <p>Failed to load module: {alias}</p>
      </div>
    );
  }

  return null;
}
