import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Overview from '../../pages/Overview'
import { overviewApi } from '../../api/overview'
import type { OverviewResponse } from '../../types'

const MOCK_OVERVIEW_DATA: OverviewResponse = {
  iso_year: 2026,
  iso_week: 34,
  week_label: 'CW34',
  week_start: '2026-08-17',
  global_metrics: {
    average_oee: 81.5,
    total_output: 152280,
    average_scrap_rate: 1.51,
    total_downtime: 43.8,
    total_locations: 2,
    total_projects: 2,
    on_target_projects: 2,
  },
  locations: [
    {
      location: 'Morocco',
      average_oee: 83.9,
      total_output: 18540,
      projects_count: 1,
      projects: [
        {
          id: 'proj-1',
          name: 'MEB21 HV',
          location: 'Morocco',
          status: 'ACTIVE',
          sets_count: 2,
          sets: ['Set 1', 'Set 2'],
          oee: 83.9,
          oee_diff: 6.3,
          output: 18540,
          scrap_rate: 1.55,
          downtime: 5.3,
          latest_highlight: 'Strong recovery, targets met',
          highlight_status: 'GOOD',
        },
      ],
    },
    {
      location: 'Mexico',
      average_oee: 80.7,
      total_output: 26730,
      projects_count: 1,
      projects: [
        {
          id: 'proj-2',
          name: 'BMW',
          location: 'Mexico',
          status: 'ACTIVE',
          sets_count: 3,
          sets: ['Set 1', 'Set 2', 'Set 3'],
          oee: 80.7,
          oee_diff: 3.0,
          output: 26730,
          scrap_rate: 1.5,
          downtime: 7.7,
          latest_highlight: 'Stable operations',
          highlight_status: 'GOOD',
        },
      ],
    },
  ],
}

describe('Overview Page Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(overviewApi, 'getOverview').mockResolvedValue(MOCK_OVERVIEW_DATA)
  })

  it('renders global company KPIs and location summaries', async () => {
    render(
      <MemoryRouter initialEntries={['/?week=34&year=2026']}>
        <Overview />
      </MemoryRouter>
    )

    expect(screen.getByText(/Manufacturing Overview/i)).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText('81.5%')).toBeInTheDocument()
    })

    expect(screen.getByText('152,280')).toBeInTheDocument()
    expect(screen.getByText('1.51%')).toBeInTheDocument()
    expect(screen.getByText('43.8')).toBeInTheDocument()

    // Location headings
    expect(screen.getByText(/Morocco Manufacturing Site/i)).toBeInTheDocument()
    expect(screen.getByText(/Mexico Manufacturing Site/i)).toBeInTheDocument()

    // Project cards
    expect(screen.getByText('MEB21 HV')).toBeInTheDocument()
    expect(screen.getByText('BMW')).toBeInTheDocument()
    expect(screen.getByText('Strong recovery, targets met')).toBeInTheDocument()
  })

  it('filters project cards by location tab', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={['/?week=34&year=2026']}>
        <Overview />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('MEB21 HV')).toBeInTheDocument()
      expect(screen.getByText('BMW')).toBeInTheDocument()
    })

    // Click Mexico Plant tab
    const mexicoBtn = screen.getByRole('button', { name: /Mexico Plant/i })
    await user.click(mexicoBtn)

    // BMW should remain, Morocco should disappear
    expect(screen.getByText('BMW')).toBeInTheDocument()
    expect(screen.queryByText('MEB21 HV')).not.toBeInTheDocument()
  })

  it('filters projects by search input', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={['/?week=34&year=2026']}>
        <Overview />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('MEB21 HV')).toBeInTheDocument()
    })

    const searchInput = screen.getByPlaceholderText(/Search projects/i)
    await user.type(searchInput, 'BMW')

    expect(screen.getByText('BMW')).toBeInTheDocument()
    expect(screen.queryByText('MEB21 HV')).not.toBeInTheDocument()
  })
})
