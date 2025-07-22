'use client';

import { ErrorBoundary } from './error-boundary';

interface ClientErrorBoundaryProps {
  children: React.ReactNode;
}

export default function ClientErrorBoundary({ children }: ClientErrorBoundaryProps) {
  return <ErrorBoundary>{children}</ErrorBoundary>;
} 