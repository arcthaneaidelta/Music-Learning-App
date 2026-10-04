import React from 'react';
import { Link } from 'react-router-dom';
import { Logo } from '../../components/ui/Logo';
import { Button } from '../../components/ui/Button';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-bg text-ink flex flex-col items-center justify-between p-6">
      <header className="w-full max-w-4xl flex items-center justify-between">
        <Link to="/">
          <Logo size="md" />
        </Link>
      </header>

      <main className="text-center flex flex-col items-center gap-4 max-w-md">
        <div className="text-xs font-mono uppercase tracking-widest text-accent font-semibold">
          Error 404
        </div>
        <h1 className="text-4xl sm:text-5xl font-display font-medium text-ink tracking-tight">
          That bar doesn't exist.
        </h1>
        <p className="text-sm font-ui text-ink-2 leading-relaxed">
          The measure or page you were looking for is outside the score.
        </p>
        <Link to="/" className="mt-4">
          <Button variant="primary" size="md">
            Back to the start →
          </Button>
        </Link>
      </main>

      <footer className="text-xs font-ui text-ink-3">
        Metre · The audio is the clock.
      </footer>
    </div>
  );
};
