/**
 * src/__tests__/integration/Login.test.tsx
 *
 * Integration tests for the Login page.
 * MSW intercepts the real axios call to /api/v1/auth/login.
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Login from '../../pages/Login'

// ─────────────────────────────────────────────────────────────────────────────
// Mocks
// ─────────────────────────────────────────────────────────────────────────────

const mockLogin = vi.fn()
const mockNavigate = vi.fn()

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    loading: false,
    login: mockLogin,
    logout: vi.fn(),
  }),
}))

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    Navigate: ({ to }: { to: string }) => <div data-testid="navigate" data-to={to} />,
  }
})

function renderLogin() {
  return render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>,
  )
}

/** Exact label text helpers — avoids ambiguity when regex matches multiple elements */
const emailInput = () => screen.getByLabelText('Email')
const passwordInput = () => screen.getByLabelText('Password')
const submitBtn = () => screen.getByRole('button', { name: /sign in/i })

// ─────────────────────────────────────────────────────────────────────────────
// Rendering
// ─────────────────────────────────────────────────────────────────────────────

describe('Login — rendering', () => {
  it('renders email input', () => {
    renderLogin()
    expect(emailInput()).toBeInTheDocument()
  })

  it('renders password input', () => {
    renderLogin()
    expect(passwordInput()).toBeInTheDocument()
  })

  it('renders Sign In button', () => {
    renderLogin()
    expect(submitBtn()).toBeInTheDocument()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Validation
// ─────────────────────────────────────────────────────────────────────────────

describe('Login — form validation', () => {
  it('shows "Email is required" when submitting empty email', async () => {
    const user = userEvent.setup()
    renderLogin()

    await user.click(submitBtn())

    expect(await screen.findByText(/email is required/i)).toBeInTheDocument()
  })

  it('shows "Password is required" when submitting with no password', async () => {
    const user = userEvent.setup()
    renderLogin()

    await user.type(emailInput(), 'admin@sebn.com')
    await user.click(submitBtn())

    expect(await screen.findByText(/password is required/i)).toBeInTheDocument()
  })

  it('shows "Enter a valid email address" for malformed email', async () => {
    const user = userEvent.setup()
    renderLogin()

    await user.type(emailInput(), 'not-an-email')
    await user.type(passwordInput(), 'somepass')
    await user.click(submitBtn())

    expect(await screen.findByText(/enter a valid email address/i)).toBeInTheDocument()
  })

  it('does not call login when form is invalid', async () => {
    const user = userEvent.setup()
    renderLogin()
    mockLogin.mockClear()

    await user.click(submitBtn())

    expect(mockLogin).not.toHaveBeenCalled()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Password visibility toggle
// ─────────────────────────────────────────────────────────────────────────────

describe('Login — password toggle', () => {
  it('password field starts as type="password"', () => {
    renderLogin()
    expect(passwordInput()).toHaveAttribute('type', 'password')
  })

  it('toggles to type="text" when show-password button is clicked', async () => {
    const user = userEvent.setup()
    renderLogin()

    await user.click(screen.getByRole('button', { name: /show password/i }))

    expect(passwordInput()).toHaveAttribute('type', 'text')
  })

  it('toggles back to type="password" on second click', async () => {
    const user = userEvent.setup()
    renderLogin()

    await user.click(screen.getByRole('button', { name: /show password/i }))
    await user.click(screen.getByRole('button', { name: /hide password/i }))

    expect(passwordInput()).toHaveAttribute('type', 'password')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Successful login
// ─────────────────────────────────────────────────────────────────────────────

describe('Login — successful submit', () => {
  it('calls login() with trimmed email and password', async () => {
    const user = userEvent.setup()
    mockLogin.mockResolvedValue(undefined)
    renderLogin()

    await user.type(emailInput(), '  admin@sebn.com  ')
    await user.type(passwordInput(), 'correct-password')
    await user.click(submitBtn())

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('admin@sebn.com', 'correct-password')
    })
  })

  it('navigates to "/" after successful login', async () => {
    const user = userEvent.setup()
    mockLogin.mockResolvedValue(undefined)
    mockNavigate.mockClear()
    renderLogin()

    await user.type(emailInput(), 'admin@sebn.com')
    await user.type(passwordInput(), 'correct-password')
    await user.click(submitBtn())

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true }))
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Failed login (server error)
// ─────────────────────────────────────────────────────────────────────────────

describe('Login — server error', () => {
  it('shows error message when credentials are wrong', async () => {
    const user = userEvent.setup()
    mockLogin.mockRejectedValue({
      isAxiosError: true,
      response: { data: { detail: 'Invalid email or password' } },
    })
    renderLogin()

    await user.type(emailInput(), 'admin@sebn.com')
    await user.type(passwordInput(), 'wrong-password')
    await user.click(submitBtn())

    expect(await screen.findByText(/invalid email or password/i)).toBeInTheDocument()
  })

  it('shows generic message when no server response', async () => {
    const user = userEvent.setup()
    mockLogin.mockRejectedValue({
      isAxiosError: true,
      response: undefined,
    })
    renderLogin()

    await user.type(emailInput(), 'admin@sebn.com')
    await user.type(passwordInput(), 'any-pass')
    await user.click(submitBtn())

    expect(await screen.findByText(/unable to reach the server/i)).toBeInTheDocument()
  })
})
