'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { logger } from '@/lib/utils/logger'
import { t } from '@/lib/i18n'
import { Button } from '@/components/form/Button'
import { Home, RefreshCw, Globe } from 'lucide-react'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function MarketingError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log the error to error reporting service
    logger.error('Marketing section error boundary caught error', {
      error: error.message,
      stack: error.stack,
      digest: error.digest,
      section: 'marketing',
    })
  }, [error])

  const translations = t()

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center border border-gray-200 dark:border-gray-700">
        <div className="mb-6">
          <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
            <Globe className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {translations.errorBoundary.somethingWentWrong}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            页面遇到了问题，请重试或返回首页
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
