import '@testing-library/jest-dom'
import { toHaveNoViolations } from 'jest-axe'
import { TextEncoder, TextDecoder } from 'util'

expect.extend(toHaveNoViolations)

Object.assign(global, { TextDecoder, TextEncoder })

// Polyfill Fetch API for next/server in jsdom (Request/Response not defined in jsdom).
// In Node 18+ these exist on globalThis; copy to global so next/server sees them.
if (typeof globalThis.Request !== 'undefined') {
  ;(global as unknown as { Request: typeof globalThis.Request }).Request = globalThis.Request
  ;(global as unknown as { Response: typeof globalThis.Response }).Response = globalThis.Response
  ;(global as unknown as { Headers: typeof globalThis.Headers }).Headers = globalThis.Headers
}

// Mock window.matchMedia for next-themes and other components
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  })
}

// Mock ResizeObserver for Radix UI components
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))
