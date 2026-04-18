import type { Config } from 'jest'
import nextJest from 'next/jest.js'
 
const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
})
 
/** Drop from coverage when those files are loaded: bootstrap + heavy UI/hooks (E2E). */
const coveragePathIgnorePatterns = [
  '<rootDir>/src/lib/supabaseClient.ts',
  '<rootDir>/src/lib/supabaseServer.ts',
  '<rootDir>/src/lib/supabaseAdmin.ts',
  '<rootDir>/src/app/learn/components/LearnProgressShare.tsx',
  '<rootDir>/src/app/learn/components/ProfileSwitcher.tsx',
  '<rootDir>/src/app/learn/components/LearnSettingsSheetContent.tsx',
  '<rootDir>/src/app/hooks/usePhoneSignIn.ts',
  '<rootDir>/src/app/learn/components/GuestLearn.tsx',
  '<rootDir>/src/app/learn/components/GuestEmptyState.tsx',
  '<rootDir>/src/app/learn/components/InviteCard.tsx',
  '<rootDir>/src/app/learn/hooks/useGuestLearnSession.ts',
  '<rootDir>/src/app/hooks/useAppleSignIn.ts',
  '<rootDir>/src/app/learn/hooks/useLearnKeyboardShortcuts.ts',
  '<rootDir>/src/app/learn/components/NpsRating.tsx',
  '<rootDir>/src/app/learn/components/ExamVocabProgressBar.tsx',
  '<rootDir>/src/app/learn/components/SignupPrompt.tsx',
]

// Add any custom config to be passed to Jest
const config: Config = {
  coverageProvider: 'v8',
  testEnvironment: 'jsdom',
  coveragePathIgnorePatterns,
  coverageThreshold: {
    global: {
      branches: 75,
      /** Many UI modules export arrow fns; line coverage is the primary gate. */
      functions: 45,
      lines: 80,
      statements: 80,
    },
  },
  // Add more setup options before each test is run
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
}
 
// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
export default createJestConfig(config)