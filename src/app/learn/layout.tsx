import { ErrorBoundary } from "@/components/ErrorBoundary";

export default function LearnLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ErrorBoundary level="section">
      {children}
    </ErrorBoundary>
  );
}
