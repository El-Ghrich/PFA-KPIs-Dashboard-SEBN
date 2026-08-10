import { describe, it, expect } from 'vitest'
import { AxiosError, AxiosHeaders } from 'axios'
import { parseApiError } from '../../lib/errorUtils'

describe('parseApiError', () => {
  it('handles null/undefined error with fallback message', () => {
    const res = parseApiError(null, 'Custom fallback')
    expect(res.title).toBe('Unknown Error')
    expect(res.message).toBe('Custom fallback')
    expect(res.isNetworkError).toBe(false)
  })

  it('detects network failure / server offline (code ERR_NETWORK)', () => {
    const error = new AxiosError('Network Error', 'ERR_NETWORK')
    const res = parseApiError(error)

    expect(res.title).toBe('Backend Unreachable')
    expect(res.message).toContain('Unable to connect to the server')
    expect(res.isNetworkError).toBe(true)
    expect(res.code).toBe('ERR_NETWORK')
  })

  it('handles 401 Unauthorized status', () => {
    const error = new AxiosError(
      'Unauthorized',
      '401',
      undefined,
      {},
      {
        status: 401,
        statusText: 'Unauthorized',
        headers: new AxiosHeaders(),
        config: { headers: new AxiosHeaders() },
        data: { detail: 'Token has expired' },
      },
    )
    const res = parseApiError(error)

    expect(res.title).toBe('Session Expired')
    expect(res.message).toBe('Token has expired')
    expect(res.isAuthError).toBe(true)
    expect(res.status).toBe(401)
  })

  it('handles 403 Forbidden status', () => {
    const error = new AxiosError(
      'Forbidden',
      '403',
      undefined,
      {},
      {
        status: 403,
        statusText: 'Forbidden',
        headers: new AxiosHeaders(),
        config: { headers: new AxiosHeaders() },
        data: { detail: 'Only super admin can grant roles' },
      },
    )
    const res = parseApiError(error)

    expect(res.title).toBe('Access Denied')
    expect(res.message).toBe('Only super admin can grant roles')
    expect(res.status).toBe(403)
  })

  it('handles 404 Not Found status', () => {
    const error = new AxiosError(
      'Not Found',
      '404',
      undefined,
      {},
      {
        status: 404,
        statusText: 'Not Found',
        headers: new AxiosHeaders(),
        config: { headers: new AxiosHeaders() },
        data: { detail: 'Project not found' },
      },
    )
    const res = parseApiError(error)

    expect(res.title).toBe('Resource Not Found')
    expect(res.message).toBe('Project not found')
    expect(res.status).toBe(404)
  })

  it('handles 422 Pydantic array validation errors', () => {
    const error = new AxiosError(
      'Unprocessable Entity',
      '422',
      undefined,
      {},
      {
        status: 422,
        statusText: 'Unprocessable Entity',
        headers: new AxiosHeaders(),
        config: { headers: new AxiosHeaders() },
        data: {
          detail: [
            { msg: 'Field required', loc: ['body', 'name'] },
            { msg: 'Invalid email format', loc: ['body', 'email'] },
          ],
        },
      },
    )
    const res = parseApiError(error)

    expect(res.title).toBe('Invalid Input')
    expect(res.message).toBe('Field required, Invalid email format')
    expect(res.status).toBe(422)
  })

  it('handles 500 Server Error status', () => {
    const error = new AxiosError(
      'Internal Server Error',
      '500',
      undefined,
      {},
      {
        status: 500,
        statusText: 'Internal Error',
        headers: new AxiosHeaders(),
        config: { headers: new AxiosHeaders() },
        data: { detail: 'Database connection error' },
      },
    )
    const res = parseApiError(error)

    expect(res.title).toBe('Server Error (HTTP 500)')
    expect(res.message).toBe('Database connection error')
    expect(res.isNetworkError).toBe(true)
    expect(res.status).toBe(500)
  })

  it('handles standard Error instances', () => {
    const error = new Error('Custom JS runtime error')
    const res = parseApiError(error)

    expect(res.title).toBe('Application Error')
    expect(res.message).toBe('Custom JS runtime error')
  })

  it('handles plain string errors', () => {
    const res = parseApiError('String error message')
    expect(res.title).toBe('Error')
    expect(res.message).toBe('String error message')
  })
})
