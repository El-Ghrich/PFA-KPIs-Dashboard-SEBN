import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import BulkDataEntry from '../../pages/BulkDataEntry'
import { MOCK_ADMIN_USER } from '../mocks/data'

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: MOCK_ADMIN_USER,
    loading: false,
    login: vi.fn(),
    logout: vi.fn(),
  }),
}))

vi.mock('../../contexts/ToastContext', () => ({
  useToast: () => ({
    showSuccess: vi.fn(),
    showError: vi.fn(),
  }),
}))

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
    },
  })
}

function renderComponent() {
  const queryClient = createQueryClient()

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <BulkDataEntry />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('BulkDataEntry Integration Tests', () => {
  it('renders title, filter bar, and paste zone', async () => {
    renderComponent()

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /bulk data entry/i })).toBeInTheDocument()
      expect(screen.getByText(/paste data from excel here/i)).toBeInTheDocument()
      expect(screen.getByText(/last updated: cw02/i)).toBeInTheDocument()
    })
  })

  it('populates preview table on pasting excel clipboard data', async () => {
    renderComponent()

    await waitFor(() => {
      expect(screen.getByText(/last updated: cw02/i)).toBeInTheDocument()
    })

    const pasteZone = screen.getByText(/paste data from excel here/i).closest('div')!

    const pasteData = `set\tweek\tOutput\tscrape\toee\tcim1\tcim2\tcim3\r\nSet 1\t25\t9200\t1,5\t82,5\t95,2\t94,1\t96,0`

    fireEvent.paste(pasteZone, {
      clipboardData: {
        getData: (format: string) => (format === 'text/plain' ? pasteData : ''),
      },
    })

    await waitFor(() => {
      expect(screen.getByText(/data preview \(1 row\)/i)).toBeInTheDocument()
    })

    // Check preview table inputs
    const inputs = screen.getAllByRole('spinbutton') // numeric inputs
    expect(inputs.length).toBeGreaterThan(0)

    // Upload button
    expect(screen.getByRole('button', { name: /upload \[1\] weeks of data/i })).toBeInTheDocument()
  })

  it('displays warning banner and disables upload button when rows contain invalid weeks or unknown sets', async () => {
    renderComponent()

    await waitFor(() => {
      expect(screen.getByText(/last updated: cw02/i)).toBeInTheDocument()
    })

    const pasteZone = screen.getByText(/paste data from excel here/i).closest('div')!

    // Week 99 is invalid (max 53), UnknownSet does not exist
    const invalidData = `set\tweek\tOutput\tscrape\toee\tcim1\tcim2\tcim3\r\nUnknownSet\t99\t9200\t1,5\t82,5\t95,2\t94,1\t96,0`

    fireEvent.paste(pasteZone, {
      clipboardData: {
        getData: (format: string) => (format === 'text/plain' ? invalidData : ''),
      },
    })

    await waitFor(() => {
      expect(screen.getByText(/validation issues/i)).toBeInTheDocument()
    })

    // Upload button should be disabled
    const uploadBtn = screen.getByRole('button', { name: /upload \[1\] weeks of data/i })
    expect(uploadBtn).toBeDisabled()
  })

  it('clears preview table when Clear Data is clicked', async () => {
    renderComponent()

    await waitFor(() => {
      expect(screen.getByText(/last updated: cw02/i)).toBeInTheDocument()
    })

    const pasteZone = screen.getByText(/paste data from excel here/i).closest('div')!
    const pasteData = `set\tweek\tOutput\tscrape\toee\tcim1\tcim2\tcim3\r\nSet 1\t25\t9200\t1,5\t82,5\t95,2\t94,1\t96,0`

    fireEvent.paste(pasteZone, {
      clipboardData: {
        getData: (format: string) => (format === 'text/plain' ? pasteData : ''),
      },
    })

    await waitFor(() => {
      expect(screen.getByText(/data preview \(1 row\)/i)).toBeInTheDocument()
    })

    // Click Clear Data
    fireEvent.click(screen.getByRole('button', { name: /clear data/i }))

    await waitFor(() => {
      expect(screen.getByText(/paste data from excel here/i)).toBeInTheDocument()
    })
  })
})
