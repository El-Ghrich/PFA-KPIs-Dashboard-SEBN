import axios from 'axios'

export interface ParsedApiError {
  title: string
  message: string
  status?: number
  code?: string
  isNetworkError: boolean
  isAuthError: boolean
  detail?: string | string[] | Record<string, unknown> | Array<{ msg?: string; loc?: string[] }> | unknown
}

/**
 * Parses any error (AxiosError, Error, string, unknown) into a clean,
 * user-friendly structured error object with actionable advice.
 */
export function parseApiError(error: unknown, fallbackMessage = 'An unexpected error occurred.'): ParsedApiError {
  if (!error) {
    return {
      title: 'Unknown Error',
      message: fallbackMessage,
      isNetworkError: false,
      isAuthError: false,
    }
  }

  // Handle Axios errors specifically
  if (axios.isAxiosError(error)) {
    const status = error.response?.status
    const code = error.code
    const responseData = error.response?.data as { detail?: string | Array<{ msg?: string; loc?: string[] }> | Record<string, unknown> } | undefined

    // 1. Network disconnect or server down (ERR_NETWORK, ECONNREFUSED, fetch failure, status 0 or undefined)
    if (!error.response || code === 'ERR_NETWORK' || code === 'ECONNREFUSED' || status === 0) {
      return {
        title: 'Server Unreachable',
        message: 'Unable to connect to the server. Please check your network connection, or retry again later.',
        code: code || 'NETWORK_ERROR',
        isNetworkError: true,
        isAuthError: false,
      }
    }

    // Extract detail message from FastAPI response
    let extractedMessage = ''
    if (responseData?.detail) {
      if (typeof responseData.detail === 'string') {
        extractedMessage = responseData.detail
      } else if (Array.isArray(responseData.detail)) {
        extractedMessage = responseData.detail.map(d => (typeof d === 'object' && d?.msg ? d.msg : JSON.stringify(d))).join(', ')
      } else {
        extractedMessage = JSON.stringify(responseData.detail)
      }
    }

    // 2. Specific HTTP Status Codes
    switch (status) {
      case 401:
        return {
          title: 'Session Expired',
          message: extractedMessage || 'Your session has expired or authentication is required. Please sign in again.',
          status,
          code: 'UNAUTHORIZED',
          isNetworkError: false,
          isAuthError: true,
          detail: responseData?.detail,
        }

      case 403:
        return {
          title: 'Access Denied',
          message: extractedMessage || 'You do not have the required permissions to perform this operation.',
          status,
          code: 'FORBIDDEN',
          isNetworkError: false,
          isAuthError: false,
          detail: responseData?.detail,
        }

      case 404:
        return {
          title: 'Resource Not Found',
          message: extractedMessage || 'The requested resource could not be found on the server.',
          status,
          code: 'NOT_FOUND',
          isNetworkError: false,
          isAuthError: false,
          detail: responseData?.detail,
        }

      case 400:
      case 422:
        return {
          title: 'Invalid Input',
          message: extractedMessage || 'The server rejected your request due to invalid data format.',
          status,
          code: 'VALIDATION_ERROR',
          isNetworkError: false,
          isAuthError: false,
          detail: responseData?.detail,
        }

      case 500:
      case 502:
      case 503:
      case 504:
        return {
          title: 'Server Error (HTTP ' + status + ')',
          message: extractedMessage || 'The server encountered an error processing your request. Please try again in a few moments.',
          status,
          code: 'SERVER_ERROR',
          isNetworkError: true,
          isAuthError: false,
          detail: responseData?.detail,
        }

      default:
        return {
          title: 'Request Failed',
          message: extractedMessage || error.message || fallbackMessage,
          status,
          code: code || 'HTTP_ERROR',
          isNetworkError: false,
          isAuthError: false,
          detail: responseData?.detail,
        }
    }
  }

  // Standard JavaScript Error object
  if (error instanceof Error) {
    return {
      title: 'Application Error',
      message: error.message || fallbackMessage,
      isNetworkError: false,
      isAuthError: false,
    }
  }

  // String error
  if (typeof error === 'string') {
    return {
      title: 'Error',
      message: error,
      isNetworkError: false,
      isAuthError: false,
    }
  }

  return {
    title: 'Unexpected Error',
    message: fallbackMessage,
    isNetworkError: false,
    isAuthError: false,
  }
}
