/**
 * src/__tests__/setup.ts
 *
 * Global test setup:
 *  1. Extends Vitest's `expect` with jest-dom DOM matchers.
 *  2. Starts the MSW server before all tests, resets handlers between tests,
 *     and stops the server after the full suite.
 */

import '@testing-library/jest-dom/vitest'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { cleanup } from '@testing-library/react'
import { server } from './mocks/server'

// Start MSW server before all tests
beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }))

// Reset any runtime request handlers added during a test
afterEach(() => {
  server.resetHandlers()
  cleanup()
})

// Clean up once the test suite is done
afterAll(() => server.close())
