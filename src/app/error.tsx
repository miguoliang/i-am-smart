'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { logger } from '@/lib/utils/logger'
import { t } from '@/lib/i18n'
import { Button } from '@/components/form/Button'
import { Home, RefreshCw } from 'lucide-react'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log the error to error reporting service
    logger.error('Global error boundary caught error', {
      error: error.message,
      stack: error.stack,
      digest: error.digest,
    })
  }, [error])

  const translations = t()

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
        <div className="mb-6">
          <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
            <svg
              className="w-8 h-8 text-red-600 dark:text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {translations.errorBoundary.somethingWentWrong}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {translations.errorBoundary.unexpectedError}
          </p>
        </div>

        {process.env.NODE_ENV === 'development' && (
          <div className="mb-6 p-4 bg-gray-100 dark:bg-gray-900 rounded-md text-left">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              {translations.errorBoundary.errorDetails}:
            </p>
            <pre className="text-xs text-gray-600 dark:text-gray-400 overflow-auto">
              {error.message}
              {error.stack && `\n\n${error.stack}`}
            </pre>
            {error.digest && (
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                {translations.errorBoundary.errorId}: {error.digest}
              </p>
            )}
          </div>
        )}

        {error.digest && process.env.NODE_ENV === 'production' && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            {translations.errorBoundary.errorId}: {error.digest}
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={reset} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            {translations.errorBoundary.tryAgain}
          </Button>
          <Button variant="outline" asChild>
            <Link href="/">
              <span className="flex items-center gap-2">
                <Home className="h-4 w-4" />
                {translations.errorBoundary.goHome}
              </span>
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
