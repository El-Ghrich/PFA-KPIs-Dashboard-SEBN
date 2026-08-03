import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { projectsApi } from '../api/projects'
import { kpisApi } from '../api/kpis'
import { highlightsApi } from '../api/highlights'
import { Card } from '../components/ui/Card'
import { Dropdown } from '../components/ui/Dropdown'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { HighlightEditor, type HighlightEditorItem } from '../components/HighlightEditor'
import { DEFAULT_YEAR, YEARS } from '../lib/constants'
import { getCurrentISOWeek, isoWeekRange, mondayOfISOWeek, weekLabelFromNumber } from '../lib/isoDate'
import { formatDateRange } from '../lib/format'
import type { KPIRecord } from '../types'

const WEEK_OPTIONS = Array.from({ length: 53 }, (_, i) => ({
  value: i + 1,
  label: weekLabelFromNumber(i + 1),
}))

const YEAR_OPTIONS = YEARS.map(y => ({ value: Number(y), label: y }))

function toISODate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export default function WeeklyEntry() {
  const queryClient = useQueryClient()

  const [projectId, setProjectId] = useState('')
  const [year, setYear] = useState(DEFAULT_YEAR)
  const [week, setWeek] = useState(getCurrentISOWeek())
  const [values, setValues] = useState<Record<string, string>>({})
  const [good, setGood] = useState<HighlightEditorItem[]>([])
  const [bad, setBad] = useState<HighlightEditorItem[]>([])

  const projectsQuery = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectsApi.list(1, 100),
  })
  const projects = projectsQuery.data?.items ?? []

  useEffect(() => {
    if (projectId || projects.length === 0) return
    setProjectId(projects[0].id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, projects])

  const definitionsQuery = useQuery({
    queryKey: ['kpi-definitions'],
    queryFn: () => kpisApi.getDefinitions(),
  })
  const definitions = definitionsQuery.data ?? []

  const enabled = !!projectId
  const recordDate = useMemo(
    () => (enabled ? toISODate(mondayOfISOWeek(year, week)) : ''),
    [enabled, year, week],
  )
  const weekRange = useMemo(() => isoWeekRange(year, week), [year, week])

  const recordsQuery = useQuery({
    queryKey: ['weekly-records', projectId, year, week],
    queryFn: () => kpisApi.getRecords(projectId, 'WEEKLY', year, week),
    enabled,
  })
  const records = recordsQuery.data ?? []

  const highlightsQuery = useQuery({
    queryKey: ['weekly-highlights', projectId, year, week],
    queryFn: () => highlightsApi.list(projectId, 'WEEKLY', year, week),
    enabled,
  })
  const existingHighlights = highlightsQuery.data ?? []

  useEffect(() => {
    if (!enabled || recordsQuery.isLoading) return
    const next: Record<string, string> = {}
    for (const rec of records) {
      next[rec.kpi_id] = rec.numeric_value != null ? String(rec.numeric_value) : ''
    }
    setValues(next)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, records, recordsQuery.isLoading])

  useEffect(() => {
    if (!enabled || highlightsQuery.isLoading) return
    const g: HighlightEditorItem[] = []
    const b: HighlightEditorItem[] = []
    for (const h of existingHighlights) {
      const item = { localId: crypto.randomUUID(), existingId: h.id, text: h.value }
      if (h.status === 'GOOD') g.push(item)
      else b.push(item)
    }
    setGood(g)
    setBad(b)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, existingHighlights, highlightsQuery.isLoading])

  const recordsByKpi = useMemo(() => {
    const map: Record<string, KPIRecord> = {}
    for (const rec of records) map[rec.kpi_id] = rec
    return map
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [records])

  const saveMutation = useMutation({
    mutationFn: async () => {
      const createItems: { project_id: string; kpi_id: string; record_date: string; period: 'WEEKLY'; numeric_value: number }[] = []
      const patches: { id: string; numeric_value: number }[] = []

      for (const def of definitions) {
        const raw = values[def.id]
        const numeric = Number(raw)
        if (raw.trim() === '' || Number.isNaN(numeric)) continue
        const existing = recordsByKpi[def.id]
        if (existing) patches.push({ id: existing.id, numeric_value: numeric })
        else createItems.push({
          project_id: projectId,
          kpi_id: def.id,
          record_date: recordDate,
          period: 'WEEKLY',
          numeric_value: numeric,
        })
      }

      for (const p of patches) await kpisApi.updateRecord(p.id, { numeric_value: p.numeric_value })
      if (createItems.length > 0) await kpisApi.createRecordsBulk(createItems)
      for (const [status, items] of [['GOOD', good], ['BAD', bad]] as const) {
        for (const it of items) {
          const text = it.text.trim()
          if (it.existingId) {
            if (text) await highlightsApi.update(it.existingId, { value: text, status })
            else await highlightsApi.remove(it.existingId)
          } else if (text) {
            await highlightsApi.create({
              project_id: projectId,
              record_date: recordDate,
              period: 'WEEKLY',
              value: text,
              status,
            })
          }
        }
      }
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['dashboard', projectId, year] }),
        recordsQuery.refetch(),
        highlightsQuery.refetch(),
      ])
    },
  })

  const anyExisting = records.length > 0 || existingHighlights.length > 0

  return (
    <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-surface">
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="max-w-[1440px] mx-auto w-full px-8 py-8">
          <header className="mb-6">
            <h1 className="text-2xl font-semibold text-on-surface">Weekly KPI Entry</h1>
            <p className="text-sm text-on-surface-variant mt-1">
              Record or update output, OEE, downtime, scrap rate and an optional highlight for the selected week.
            </p>
          </header>

          <Card className="mb-6">
            <div className="flex flex-wrap items-end gap-4">
              <Dropdown<string>
                label="Project"
                value={projectId}
                options={projects.map(p => ({ value: p.id, label: p.name }))}
                onChange={setProjectId}
                className="min-w-[200px]"
              />
              <Dropdown<number>
                label="ISO Year"
                value={year}
                options={YEAR_OPTIONS}
                onChange={setYear}
              />
              <Dropdown<number>
                label="ISO Week"
                value={week}
                options={WEEK_OPTIONS}
                onChange={setWeek}
              />
              {enabled && (
                <p className="text-[13px] text-on-surface-variant font-medium pb-2">
                  {formatDateRange(weekRange.monday, weekRange.sunday, true)}
                </p>
              )}
            </div>
          </Card>

          {!enabled ? (
            <EmptyState className="h-64" message="Select a project to load the week" />
          ) : definitionsQuery.isLoading || recordsQuery.isLoading || highlightsQuery.isLoading ? (
            <EmptyState className="h-64" message="Loading week data..." />
          ) : (
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[15px] font-semibold text-on-surface">
                  {weekLabelFromNumber(week)} · {formatDateRange(weekRange.monday, weekRange.sunday, true)}
                </h2>
                {anyExisting && (
                  <span className="text-[11px] font-semibold uppercase tracking-wide px-2 py-1 rounded-full bg-primary/10 text-primary">
                    Week has existing data — editing in place
                  </span>
                )}
              </div>

              {definitions.length === 0 ? (
                <EmptyState className="h-40" message="No KPI definitions found" />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  {definitions.map(def => (
                    <Input
                      key={def.id}
                      id={`kpi-${def.id}`}
                      label={def.name}
                      type="number"
                      inputMode="decimal"
                      step="any"
                      value={values[def.id] ?? ''}
                      suffix={<span className="text-[12px] text-on-surface-variant/60">{def.unit}</span>}
                      onChange={e => setValues(prev => ({ ...prev, [def.id]: e.target.value }))}
                    />
                  ))}
                </div>
              )}

              <div className="mb-6">
                <HighlightEditor
                  good={good}
                  bad={bad}
                  onChange={(status, items) => (status === 'GOOD' ? setGood(items) : setBad(items))}
                />
              </div>

              <div className="flex items-center gap-3">
                <Button onClick={() => saveMutation.mutate()} loading={saveMutation.isPending}>
                  {anyExisting ? 'Update week' : 'Save week'}
                </Button>
                {saveMutation.isSuccess && (
                  <p className="text-[13px] text-tertiary font-medium">Saved — dashboard updated.</p>
                )}
                {saveMutation.isError && (
                  <p className="text-[13px] text-error font-medium">Save failed. Please try again.</p>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>
    </main>
  )
}