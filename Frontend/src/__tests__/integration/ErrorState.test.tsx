import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AxiosError } from 'axios'
import { ErrorState } from '../../components/ui/ErrorState'

describe('ErrorState Component', () => {
  it('renders parsed title and message for a network error', () => {
    const error = new AxiosError('Network Error', 'ERR_NETWORK')
    render(<ErrorState error={error} />)

    expect(screen.getByText('Backend Unreachable')).toBeInTheDocument()
    expect(screen.getByText(/unable to connect to the server/i)).toBeInTheDocument()
  })

  it('renders custom title and message when provided', () => {
    render(
      <ErrorState
        error={new Error('raw error')}
        title="Custom Connection Error"
        message="Custom detailed explanation"
      />,
    )

    expect(screen.getByText('Custom Connection Error')).toBeInTheDocument()
    expect(screen.getByText('Custom detailed explanation')).toBeInTheDocument()
  })

  it('renders retry button when onRetry prop is passed and triggers callback', async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn()

    render(<ErrorState error={new Error('Fail')} onRetry={onRetry} />)

    const retryButton = screen.getByRole('button', { name: /try again/i })
    expect(retryButton).toBeInTheDocument()

    await user.click(retryButton)
    expect(onRetry).toHaveBeenCalledOnce()
  })

  it('shows loading state on retry button when isRetrying is true', () => {
    render(<ErrorState error={new Error('Fail')} onRetry={vi.fn()} isRetrying={true} />)

    const retryButton = screen.getByRole('button', { name: /connecting/i })
    expect(retryButton).toBeDisabled()
  })

  it('renders compact mode layout correctly', () => {
    render(
      <ErrorState
        error={new Error('Fail')}
        title="Compact Error"
        message="Inline error message"
        compact
      />,
    )

    expect(screen.getByText('Compact Error')).toBeInTheDocument()
    expect(screen.getByText('Inline error message')).toBeInTheDocument()
  })

  it('toggles technical diagnostic details accordion', async () => {
    const user = userEvent.setup()
    const error = new AxiosError('Fail', 'ERR_SERVER_FAIL_99', undefined, undefined, {
      status: 500,
      statusText: 'Internal Error',
      headers: {} as any,
      config: {} as any,
      data: {},
    })

    render(<ErrorState error={error} />)

    const accordionBtn = screen.getByRole('button', { name: /technical diagnostics/i })
    expect(accordionBtn).toBeInTheDocument()

    // Details should be collapsed initially
    expect(screen.queryByText('SERVER_ERROR')).not.toBeInTheDocument()

    // Click to expand
    await user.click(accordionBtn)
    expect(screen.getByText('SERVER_ERROR')).toBeInTheDocument()
  })
})
