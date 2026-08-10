/**
 * src/__tests__/mocks/server.ts
 * Creates the MSW Node.js server used in the test environment.
 */
import { setupServer } from 'msw/node'
import { handlers } from './handlers'

export const server = setupServer(...handlers)
