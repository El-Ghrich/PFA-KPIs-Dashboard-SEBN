/**
 * src/__tests__/integration/ConfirmModal.test.tsx
 *
 * Integration tests for the ConfirmModal UI component.
 * No I/O — purely tests rendering, variants, and callbacks.
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ConfirmModal } from '../../components/ui/ConfirmModal'

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const BASE_PROPS = {
  open: true,
  title: 'Are you sure?',
  onConfirm: vi.fn(),
  onCancel: vi.fn(),
}

function renderModal(overrides = {}) {
  return render(<ConfirmModal {...BASE_PROPS} {...overrides} />)
}

// ─────────────────────────────────────────────────────────────────────────────
// Visibility
// ─────────────────────────────────────────────────────────────────────────────

describe('ConfirmModal — visibility', () => {
  it('renders nothing when open=false', () => {
    const { container } = render(<ConfirmModal {...BASE_PROPS} open={false} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders the modal when open=true', () => {
    renderModal()
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('has aria-modal="true"', () => {
    renderModal()
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true')
  })

  it('shows the title text', () => {
    renderModal()
    expect(screen.getByText('Are you sure?')).toBeInTheDocument()
  })

  it('shows description when provided', () => {
    renderModal({ description: 'This action cannot be undone.' })
    expect(screen.getByText('This action cannot be undone.')).toBeInTheDocument()
  })

  it('does not render description section when not provided', () => {
    renderModal()
    expect(screen.queryByText('This action cannot be undone.')).not.toBeInTheDocument()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Button labels
// ─────────────────────────────────────────────────────────────────────────────

describe('ConfirmModal — button labels', () => {
  it('shows default "Confirm" and "Cancel" labels', () => {
    renderModal()
    expect(screen.getByRole('button', { name: /confirm/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
  })

  it('shows custom confirm label', () => {
    renderModal({ confirmLabel: 'Yes, delete it' })
    expect(screen.getByRole('button', { name: /yes, delete it/i })).toBeInTheDocument()
  })

  it('shows custom cancel label', () => {
    renderModal({ cancelLabel: 'Go back' })
    expect(screen.getByRole('button', { name: /go back/i })).toBeInTheDocument()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Callbacks
// ─────────────────────────────────────────────────────────────────────────────

describe('ConfirmModal — callbacks', () => {
  it('calls onConfirm when confirm button is clicked', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()
    renderModal({ onConfirm })

    await user.click(screen.getByRole('button', { name: /confirm/i }))

    expect(onConfirm).toHaveBeenCalledOnce()
  })

  it('calls onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup()
    const onCancel = vi.fn()
    renderModal({ onCancel })

    await user.click(screen.getByRole('button', { name: /cancel/i }))

    expect(onCancel).toHaveBeenCalledOnce()
  })

  it('calls onCancel when backdrop is clicked', async () => {
    const user = userEvent.setup()
    const onCancel = vi.fn()
    renderModal({ onCancel })

    // The backdrop is the absolute div behind the panel
    const backdrop = screen.getByRole('dialog').querySelector('.absolute.inset-0')
    expect(backdrop).not.toBeNull()
    await user.click(backdrop!)

    expect(onCancel).toHaveBeenCalledOnce()
  })

  it('does NOT call onConfirm when backdrop is clicked', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()
    renderModal({ onConfirm })

    const backdrop = screen.getByRole('dialog').querySelector('.absolute.inset-0')
    await user.click(backdrop!)

    expect(onConfirm).not.toHaveBeenCalled()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Loading state
// ─────────────────────────────────────────────────────────────────────────────

describe('ConfirmModal — loading state', () => {
  it('disables confirm button when loading=true', () => {
    renderModal({ loading: true })
    expect(screen.getByRole('button', { name: /confirm/i })).toBeDisabled()
  })

  it('disables cancel button when loading=true', () => {
    renderModal({ loading: true })
    expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled()
  })

  it('shows spinner svg inside confirm button when loading=true', () => {
    renderModal({ loading: true, confirmLabel: 'Deleting' })
    const confirmBtn = screen.getByRole('button', { name: /deleting/i })
    // Spinner is an SVG with animate-spin class
    expect(confirmBtn.querySelector('svg.animate-spin')).not.toBeNull()
  })

  it('buttons are enabled when loading=false', () => {
    renderModal({ loading: false })
    expect(screen.getByRole('button', { name: /confirm/i })).not.toBeDisabled()
    expect(screen.getByRole('button', { name: /cancel/i })).not.toBeDisabled()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Variants
// ─────────────────────────────────────────────────────────────────────────────

describe('ConfirmModal — variants', () => {
  it('delete variant: confirm button has error styling class', () => {
    renderModal({ variant: 'delete' })
    const confirmBtn = screen.getByRole('button', { name: /confirm/i })
    expect(confirmBtn.className).toMatch(/bg-error/)
  })

  it('revoke variant: confirm button has alert styling class', () => {
    renderModal({ variant: 'revoke' })
    const confirmBtn = screen.getByRole('button', { name: /confirm/i })
    expect(confirmBtn.className).toMatch(/bg-alert/)
  })

  it('warning variant (default): confirm button has alert styling class', () => {
    renderModal({ variant: 'warning' })
    const confirmBtn = screen.getByRole('button', { name: /confirm/i })
    expect(confirmBtn.className).toMatch(/bg-alert/)
  })
})
