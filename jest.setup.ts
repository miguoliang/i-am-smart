import '@testing-library/jest-dom'
import { toHaveNoViolations } from 'jest-axe'
import { TextEncoder, TextDecoder } from 'util'

expect.extend(toHaveNoViolations)

Object.assign(global, { TextDecoder, TextEncoder })
