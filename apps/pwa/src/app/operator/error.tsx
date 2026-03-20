"use client";

import { useEffect } from "react";
import Link from "next/link";
import { logger } from "@/lib/utils/logger";
import { t } from "@/lib/i18n";
import { Button } from "@/components/form/Button";
import { Home, RefreshCw } from "lucide-react";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function OperatorError({ error, reset }: ErrorProps) {
  useEffect(() => {
    logger.error("Operator section error boundary caught error", {
      error: error.message,
      stack: error.stack,
      digest: error.digest,
      section: "operator",
    });
  }, [error]);

  const translations = t();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-8 text-center shadow-sm">
        <h1 className="text-base font-semibold tracking-tight text-foreground">
          {translations.errorBoundary.somethingWentWrong}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          管理面板遇到了问题，请重试或返回首页
        </p>

        {process.env.NODE_ENV === "development" && (
          <div className="mt-6 rounded-md border border-border bg-muted/50 p-4 text-left">
            <p className="mb-2 text-xs font-medium text-foreground">
              {translations.errorBoundary.errorDetails}:
            </p>
            <pre className="max-h-40 overflow-auto text-xs text-muted-foreground">
              {error.message}
              {error.stack && `\n\n${error.stack}`}
            </pre>
            {error.digest ? (
              <p className="mt-2 text-xs text-muted-foreground">
                {translations.errorBoundary.errorId}: {error.digest}
              </p>
            ) : null}
          </div>
        )}

        {error.digest && process.env.NODE_ENV === "production" ? (
          <p className="mt-4 text-xs text-muted-foreground">
            {translations.errorBoundary.errorId}: {error.digest}
          </p>
        ) : null}

        <div className="mt-8 flex flex-col justify-center gap-2 sm:flex-row">
          <Button onClick={reset} className="gap-2" variant="default">
            <RefreshCw className="h-4 w-4" />
            {translations.errorBoundary.tryAgain}
          </Button>
          <Button variant="outline" asChild>
            <Link href="/">
              <span className="flex items-center justify-center gap-2">
                <Home className="h-4 w-4" />
                {translations.errorBoundary.goHome}
              </span>
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
