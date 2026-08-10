/**
 * src/__tests__/integration/FilterBar.test.tsx
 *
 * Integration tests for the FilterBar component.
 *
 * NOTE: The app's `Dropdown` is a custom button-based component (NOT a native
 * <select>). Interaction pattern:
 *   1. Click the trigger button (shows current value as text)
 *   2. The dropdown list appears — click an option button by its label text.
 */

import { describe, it, expect, vi, type Mock } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import FilterBar from '../../components/FilterBar'
import type { FilterState } from '../../types'
import {
  MOCK_PROJECTS,
  MOCK_PROJECT_MOROCCO,
  MOCK_PROJECT_MEXICO,
  MOCK_SET_1,
  MOCK_SET_2,
} from '../mocks/data'

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const BASE_FILTERS: FilterState = {
  location: 'All',
  projectId: MOCK_PROJECT_MOROCCO.id,
  year: 2026,
  week: 15,
  compareWeek: 14,
  setId: 'All',
}

function renderFilterBar(
  filters: FilterState = BASE_FILTERS,
  overrides: {
    onChange?: Mock<(filters: FilterState) => void>
    onWeekChange?: Mock<(week: number, year: number) => void>
    projects?: typeof MOCK_PROJECTS
  } = {},
) {
  const onChange = overrides.onChange ?? vi.fn<(filters: FilterState) => void>()
  const onWeekChange = overrides.onWeekChange ?? vi.fn<(week: number, year: number) => void>()
  const projects = overrides.projects ?? MOCK_PROJECTS

  render(
    <FilterBar
      projects={projects}
      filters={filters}
      onChange={onChange}
      onWeekChange={onWeekChange}
    />,
  )
  return { onChange, onWeekChange }
}

/**
 * Open a custom Dropdown by clicking the button that shows `currentLabel`,
 * then click the option with `optionLabel`.
 */
async function selectDropdownOption(
  user: ReturnType<typeof userEvent.setup>,
  currentLabel: string,
  optionLabel: string,
) {
  // The trigger button contains the current value text
  const trigger = screen.getByRole('button', { name: new RegExp(currentLabel, 'i') })
  await user.click(trigger)
  // Option appears in the floating list — click it
  const option = await screen.findByRole('button', { name: optionLabel })
  await user.click(option)
}

// ─────────────────────────────────────────────────────────────────────────────
// Rendering
// ─────────────────────────────────────────────────────────────────────────────

describe('FilterBar — rendering', () => {
  it('renders the Location label', () => {
    renderFilterBar()
    expect(screen.getByText('Location')).toBeInTheDocument()
  })

  it('renders the Project label', () => {
    renderFilterBar()
    expect(screen.getByText('Project')).toBeInTheDocument()
  })

  it('renders the Year label', () => {
    renderFilterBar()
    expect(screen.getByText('Year')).toBeInTheDocument()
  })

  it('renders the Set label', () => {
    renderFilterBar()
    expect(screen.getByText('Set')).toBeInTheDocument()
  })

  it('renders the Reset button', () => {
    renderFilterBar()
    expect(screen.getByRole('button', { name: /reset/i })).toBeInTheDocument()
  })

  it('displays current location value in the Location trigger button', () => {
    renderFilterBar({ ...BASE_FILTERS, location: 'Morocco' })
    // The trigger shows the selected option label
    expect(screen.getByRole('button', { name: /morocco/i })).toBeInTheDocument()
  })

  it('displays current year value in the Year trigger button', () => {
    renderFilterBar({ ...BASE_FILTERS, year: 2025 })
    expect(screen.getByRole('button', { name: /2025/i })).toBeInTheDocument()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Location filter → calls onChange
// ─────────────────────────────────────────────────────────────────────────────

describe('FilterBar — location filter', () => {
  it('calls onChange with updated location when Morocco is selected', async () => {
    const user = userEvent.setup()
    const { onChange } = renderFilterBar({ ...BASE_FILTERS, location: 'All' })

    // The location dropdown trigger shows 'All' — open it then pick 'Morocco'
    // Find all buttons with name 'All' and pick the first (Location trigger)
    const allButtons = screen.getAllByRole('button', { name: 'All' })
    await user.click(allButtons[0]) // Location trigger is first
    const moroccoOption = await screen.findByRole('button', { name: 'Morocco' })
    await user.click(moroccoOption)

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ location: 'Morocco' }),
    )
  })

  it('calls onChange with location="All" when All is selected', async () => {
    const user = userEvent.setup()
    const { onChange } = renderFilterBar({ ...BASE_FILTERS, location: 'Morocco' })

    // Location trigger currently shows 'Morocco'
    await selectDropdownOption(user, 'Morocco', 'All')

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ location: 'All' }),
    )
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Project filter
// ─────────────────────────────────────────────────────────────────────────────

describe('FilterBar — project filter', () => {
  it('calls onChange with the selected projectId when project changes', async () => {
    const user = userEvent.setup()
    const { onChange } = renderFilterBar({ ...BASE_FILTERS, location: 'All' })

    // Open the Project dropdown (currently showing Morocco project name) and pick Mexico
    await selectDropdownOption(user, MOCK_PROJECT_MOROCCO.name, MOCK_PROJECT_MEXICO.name)

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ projectId: MOCK_PROJECT_MEXICO.id }),
    )
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Set filter
// ─────────────────────────────────────────────────────────────────────────────

describe('FilterBar — set filter', () => {
  it('shows project sets in Set dropdown for a project that has sets', async () => {
    const user = userEvent.setup()
    renderFilterBar({ ...BASE_FILTERS, projectId: MOCK_PROJECT_MOROCCO.id })

    // Open the Set dropdown (currently "All Sets")
    const setTrigger = screen.getByRole('button', { name: /all sets/i })
    await user.click(setTrigger)

    expect(await screen.findByRole('button', { name: MOCK_SET_1.name })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: MOCK_SET_2.name })).toBeInTheDocument()
  })

  it('shows only "All Sets" for a project with no sets', async () => {
    const user = userEvent.setup()
    renderFilterBar({ ...BASE_FILTERS, projectId: MOCK_PROJECT_MEXICO.id })

    const setTrigger = screen.getByRole('button', { name: /all sets/i })
    await user.click(setTrigger)

    expect(screen.queryByRole('button', { name: MOCK_SET_1.name })).not.toBeInTheDocument()
  })

  it('calls onChange with the selected setId when a set is chosen', async () => {
    const user = userEvent.setup()
    const { onChange } = renderFilterBar({ ...BASE_FILTERS, projectId: MOCK_PROJECT_MOROCCO.id })

    await selectDropdownOption(user, 'All Sets', MOCK_SET_1.name)

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ setId: MOCK_SET_1.id }),
    )
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Year filter
// ─────────────────────────────────────────────────────────────────────────────

describe('FilterBar — year filter', () => {
  it('calls onChange with updated year when a different year is selected', async () => {
    const user = userEvent.setup()
    const { onChange } = renderFilterBar({ ...BASE_FILTERS, year: 2026 })

    await selectDropdownOption(user, '2026', '2025')

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ year: 2025 }),
    )
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Reset
// ─────────────────────────────────────────────────────────────────────────────

describe('FilterBar — reset', () => {
  it('calls onChange with default filters when Reset is clicked', async () => {
    const user = userEvent.setup()
    const { onChange } = renderFilterBar()

    await user.click(screen.getByRole('button', { name: /reset/i }))

    expect(onChange).toHaveBeenCalledOnce()
    const call = onChange.mock.calls[0][0] as FilterState
    expect(call.location).toBe('All')
    expect(call.setId).toBe('All')
  })

  it('passes the full projects list to buildDefaultFilters on reset', async () => {
    const user = userEvent.setup()
    const { onChange } = renderFilterBar()

    await user.click(screen.getByRole('button', { name: /reset/i }))

    // Default filters use the first/preferred project from the provided list
    const call = onChange.mock.calls[0][0] as FilterState
    expect([MOCK_PROJECT_MOROCCO.id, MOCK_PROJECT_MEXICO.id]).toContain(call.projectId)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Mobile toggle
// ─────────────────────────────────────────────────────────────────────────────

describe('FilterBar — mobile toggle', () => {
  it('renders the mobile Filters toggle button', () => {
    renderFilterBar()
    // The toggle button contains the text "Filters"
    expect(screen.getByRole('button', { name: /^filters$/i })).toBeInTheDocument()
  })

  it('the expandable panel starts hidden on mobile', () => {
    renderFilterBar()
    // The expandable panel has a conditional class: 'hidden sm:block' when closed
    // It contains the dropdown grid — look for it specifically by checking
    // the block that wraps the filter dropdowns (it has sm:block class)
    const panels = document.querySelectorAll('.sm\\:block')
    // At least one panel should exist and have the 'hidden' class initially
    const hiddenPanel = Array.from(panels).find(
      (el) => el.classList.contains('hidden') && el.querySelector('button')
    )
    expect(hiddenPanel).toBeDefined()
  })

  it('clicking the toggle shows the filter panel', async () => {
    const user = userEvent.setup()
    renderFilterBar()

    await user.click(screen.getByRole('button', { name: /^filters$/i }))

    // After click: the expandable panel that contains dropdown buttons should no longer be hidden
    // It becomes 'block sm:block' instead of 'hidden sm:block'
    const panels = document.querySelectorAll('.sm\\:block')
    const stillHiddenDropdownPanel = Array.from(panels).find(
      (el) => el.classList.contains('hidden') && el.querySelector('button[class*="min-w"]')
    )
    expect(stillHiddenDropdownPanel).toBeUndefined()
  })
})
