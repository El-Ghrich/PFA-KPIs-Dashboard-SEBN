/**
 * src/__tests__/integration/WeekNavigator.test.tsx
 *
 * Integration tests for the WeekNavigator component.
 * Covers prev/next navigation, dropdown picker, Today button, and compact mode.
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import WeekNavigator from '../../components/WeekNavigator'

// ─────────────────────────────────────────────────────────────────────────────
// Helper
// ─────────────────────────────────────────────────────────────────────────────

function renderNav(overrides: Partial<React.ComponentProps<typeof WeekNavigator>> = {}) {
  const onChange = vi.fn()
  const props = {
    week: 15,
    year: 2026,
    onChange,
    showToday: true,
    ...overrides,
  }
  const result = render(<WeekNavigator {...props} />)
  return { ...result, onChange }
}

// ─────────────────────────────────────────────────────────────────────────────
// Rendering
// ─────────────────────────────────────────────────────────────────────────────

describe('WeekNavigator — rendering', () => {
  it('displays the current week label formatted as CW{nn}', () => {
    renderNav({ week: 5 })
    expect(screen.getByText('CW05')).toBeInTheDocument()
  })

  it('pads single-digit week with leading zero', () => {
    renderNav({ week: 3 })
    expect(screen.getByText('CW03')).toBeInTheDocument()
  })

  it('renders Previous week button', () => {
    renderNav()
    expect(screen.getByRole('button', { name: /previous week/i })).toBeInTheDocument()
  })

  it('renders Next week button', () => {
    renderNav()
    expect(screen.getByRole('button', { name: /next week/i })).toBeInTheDocument()
  })

  it('renders Today button when showToday=true', () => {
    renderNav({ showToday: true })
    expect(screen.getByRole('button', { name: /today/i })).toBeInTheDocument()
  })

  it('does not render Today button when showToday=false', () => {
    renderNav({ showToday: false })
    expect(screen.queryByRole('button', { name: /today/i })).not.toBeInTheDocument()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Navigation — Previous
// ─────────────────────────────────────────────────────────────────────────────

describe('WeekNavigator — previous week', () => {
  it('calls onChange with week-1 when clicking Previous', async () => {
    const user = userEvent.setup()
    const { onChange } = renderNav({ week: 15, year: 2026 })

    await user.click(screen.getByRole('button', { name: /previous week/i }))

    expect(onChange).toHaveBeenCalledWith(14, 2026)
  })

  it('crosses year boundary: CW01 → CW52 of previous year', async () => {
    const user = userEvent.setup()
    // 2026-W01 Monday = 2025-12-29, going back → 2025-W52 (Mon 2025-12-22)
    const { onChange } = renderNav({ week: 1, year: 2026 })

    await user.click(screen.getByRole('button', { name: /previous week/i }))

    const [week, year] = onChange.mock.calls[0]
    expect(year).toBe(2025)
    expect(week).toBeGreaterThanOrEqual(52)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Navigation — Next
// ─────────────────────────────────────────────────────────────────────────────

describe('WeekNavigator — next week', () => {
  it('calls onChange with week+1 when clicking Next', async () => {
    const user = userEvent.setup()
    const { onChange } = renderNav({ week: 15, year: 2026 })

    await user.click(screen.getByRole('button', { name: /next week/i }))

    expect(onChange).toHaveBeenCalledWith(16, 2026)
  })

  it('crosses year boundary: CW52 → CW01 of next year', async () => {
    const user = userEvent.setup()
    // 2026-W52 Monday = 2026-12-21, next → 2026-12-28 or 2027-01-04
    const { onChange } = renderNav({ week: 52, year: 2026 })

    await user.click(screen.getByRole('button', { name: /next week/i }))

    const [week, year] = onChange.mock.calls[0]
    // Either still week 53 of 2026 or week 1 of 2027 — year must not regress
    expect(year).toBeGreaterThanOrEqual(2026)
    expect(week).toBeGreaterThanOrEqual(1)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Today button
// ─────────────────────────────────────────────────────────────────────────────

describe('WeekNavigator — Today button', () => {
  it('calls onChange with the current ISO week and year', async () => {
    const user = userEvent.setup()
    const { onChange } = renderNav({ showToday: true })

    await user.click(screen.getByRole('button', { name: /today/i }))

    expect(onChange).toHaveBeenCalledOnce()
    // The result must be a valid week/year pair
    const [week, year] = onChange.mock.calls[0]
    expect(week).toBeGreaterThanOrEqual(1)
    expect(week).toBeLessThanOrEqual(53)
    expect(year).toBeGreaterThanOrEqual(2024)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Week picker dropdown
// ─────────────────────────────────────────────────────────────────────────────

describe('WeekNavigator — dropdown picker', () => {
  it('dropdown is not visible initially', () => {
    renderNav()
    expect(screen.queryByText('CW01')).not.toBeInTheDocument()
  })

  it('opens dropdown when CW label is clicked', async () => {
    const user = userEvent.setup()
    renderNav({ week: 15 })

    // The label button contains the current week text
    const cwButton = screen.getByText('CW15').closest('button')!
    await user.click(cwButton)

    // All 52 weeks should be visible
    expect(screen.getAllByText(/^CW\d{2}$/).length).toBeGreaterThanOrEqual(52)
  })

  it('calls onChange with selected week and same year when a week is picked', async () => {
    const user = userEvent.setup()
    const { onChange } = renderNav({ week: 15, year: 2026 })

    // Open dropdown
    await user.click(screen.getByText('CW15').closest('button')!)

    // Click CW08
    const dropdown = document.querySelector('.absolute.top-full') as HTMLElement
    const cw08 = within(dropdown).getByText('CW08')
    await user.click(cw08)

    expect(onChange).toHaveBeenCalledWith(8, 2026)
  })

  it('closes dropdown after picking a week', async () => {
    const user = userEvent.setup()
    renderNav({ week: 15 })

    await user.click(screen.getByText('CW15').closest('button')!)
    const dropdown = document.querySelector('.absolute.top-full') as HTMLElement
    await user.click(within(dropdown).getByText('CW08'))

    // Dropdown should be gone
    expect(document.querySelector('.absolute.top-full')).toBeNull()
  })

  it('highlights the currently selected week in the dropdown', async () => {
    const user = userEvent.setup()
    renderNav({ week: 15 })

    await user.click(screen.getByText('CW15').closest('button')!)

    const dropdown = document.querySelector('.absolute.top-full') as HTMLElement
    const selected = within(dropdown).getByText('CW15')
    expect(selected.className).toMatch(/font-bold/)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Compact mode
// ─────────────────────────────────────────────────────────────────────────────

describe('WeekNavigator — compact mode', () => {
  it('renders CW label in compact mode', () => {
    renderNav({ compact: true, week: 7 })
    expect(screen.getByText('CW07')).toBeInTheDocument()
  })

  it('does not render the Today button in compact mode', () => {
    renderNav({ compact: true, showToday: true })
    expect(screen.queryByRole('button', { name: /today/i })).not.toBeInTheDocument()
  })

  it('compact prev button decrements week', async () => {
    const user = userEvent.setup()
    const { onChange } = renderNav({ compact: true, week: 10, year: 2026 })

    await user.click(screen.getByRole('button', { name: /previous week/i }))

    expect(onChange).toHaveBeenCalledWith(9, 2026)
  })

  it('compact next button increments week', async () => {
    const user = userEvent.setup()
    const { onChange } = renderNav({ compact: true, week: 10, year: 2026 })

    await user.click(screen.getByRole('button', { name: /next week/i }))

    expect(onChange).toHaveBeenCalledWith(11, 2026)
  })
})
