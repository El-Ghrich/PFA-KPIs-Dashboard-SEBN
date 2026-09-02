import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import FilterBar from '../components/FilterBar'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { ErrorState } from '../components/ui/ErrorState'
import { Spinner } from '../components/ui/Spinner'
import { projectsApi } from '../api/projects'
import { kpisApi, type KPIRecordBulkCreateItem } from '../api/kpis'
import { useToast } from '../contexts/ToastContext'
import { useExcelPaste } from '../hooks/useExcelPaste'
import { buildDefaultFilters } from '../features/dashboard/filters'
import { useSettings } from '../hooks/useSettings'
import { mondayOfISOWeek, weekLabelFromNumber } from '../lib/isoDate'
import type { FilterState, Project, KPIDefinition } from '../types'
import { ClipboardPaste, CheckCircle2, UploadCloud, Trash2, RotateCcw, AlertCircle, ArrowRight } from 'lucide-react'

export default function BulkDataEntry() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { showSuccess, showError } = useToast()

  const { settings } = useSettings()
  const [filters, setFilters] = useState<FilterState>(() => buildDefaultFilters([], settings))
  const [projects, setProjects] = useState<Project[]>([])
  const [isProjectsLoading, setIsProjectsLoading] = useState(true)
  const [projectsError, setProjectsError] = useState<Error | null>(null)

  const {
    rows,
    hasHeaderDetected,
    handlePasteEvent,
    handlePasteText,
    updateCell,
    deleteRow,
    clearRows,
  } = useExcelPaste()

  // Fetch Projects
  const fetchProjects = useCallback(async () => {
    setIsProjectsLoading(true)
    setProjectsError(null)
    try {
      const result = await projectsApi.list(1, 100)
      setProjects(result.items || [])
    } catch (error) {
      setProjectsError(error as Error)
    } finally {
      setIsProjectsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  useEffect(() => {
    if (filters.projectId || projects.length === 0) return
    const defaultProj = projects[0]
    setFilters((prev) => (prev.projectId ? prev : { ...prev, projectId: defaultProj.id }))
  }, [filters.projectId, projects])

  const selectedProject = useMemo(
    () => projects.find((p) => p.id === filters.projectId),
    [projects, filters.projectId],
  )

  // Fetch KPI Definitions to map KPI IDs by name
  const kpiDefsQuery = useQuery({
    queryKey: ['kpiDefinitions'],
    queryFn: () => kpisApi.getDefinitions(),
  })
  const kpiDefinitions: KPIDefinition[] = kpiDefsQuery.data || []

  // Fetch project records to find last updated week
  const projectRecordsQuery = useQuery({
    queryKey: ['projectRecords', filters.projectId, filters.year],
    queryFn: () =>
      filters.projectId
        ? kpisApi.getRecords(filters.projectId, 'WEEKLY', filters.year)
        : Promise.resolve([]),
    enabled: Boolean(filters.projectId),
  })

  // Calculate highest recorded week number for the selected project & year
  const lastRecordedWeekInfo = useMemo(() => {
    const records = projectRecordsQuery.data || []
    if (records.length === 0) return null

    let maxWeek = 0
    records.forEach((r) => {
      if (r.record_date) {
        const d = new Date(r.record_date)
        // Compute ISO week
        const target = new Date(d.valueOf())
        const dayNr = (d.getDay() + 6) % 7
        target.setDate(target.getDate() - dayNr + 3)
        const firstThursday = target.valueOf()
        target.setMonth(0, 1)
        if (target.getDay() !== 4) {
          target.setMonth(0, 1 + ((4 - target.getDay() + 7) % 7))
        }
        const week = 1 + Math.round((firstThursday - target.valueOf()) / 604800000)
        if (week > maxWeek) maxWeek = week
      }
    })
    return maxWeek > 0 ? maxWeek : null
  }, [projectRecordsQuery.data])

  // Map KPI Definition IDs
  const kpiMap = useMemo(() => {
    const map: Record<string, string> = {}
    kpiDefinitions.forEach((def) => {
      const nameLower = def.name.toLowerCase()
      if (nameLower.includes('output')) map['output'] = def.id
      else if (nameLower.includes('scrap')) map['scrap'] = def.id
      else if (nameLower === 'oee') map['oee'] = def.id
      else if (nameLower.includes('cim-1') || nameLower.includes('cim1')) map['cim1'] = def.id
      else if (nameLower.includes('cim-2') || nameLower.includes('cim2')) map['cim2'] = def.id
      else if (nameLower.includes('cim-3') || nameLower.includes('cim3')) map['cim3'] = def.id
    })
    return map
  }, [kpiDefinitions])

  // Bulk Upload Mutation
  const bulkUploadMutation = useMutation({
    mutationFn: (payload: KPIRecordBulkCreateItem[]) => kpisApi.createRecordsBulk(payload),
    onSuccess: (res) => {
      showSuccess(`Successfully uploaded ${res.total} KPI records!`)
      clearRows()
      queryClient.invalidateQueries({ queryKey: ['projectRecords', filters.projectId] })
    },
    onError: (err) => showError(err, 'Failed to Upload Bulk Data'),
  })

  // Match raw set string (e.g. "Set 1" or "1") to project set ID
  const resolveSetId = useCallback(
    (rawSet: string): string | undefined => {
      if (!selectedProject || !selectedProject.sets || selectedProject.sets.length === 0) return undefined
      const clean = rawSet.trim().toLowerCase()
      if (!clean) return selectedProject.sets[0]?.id

      // 1. Direct name match
      const exact = selectedProject.sets.find((s) => s.name.toLowerCase() === clean)
      if (exact) return exact.id

      // 2. "Set " + clean match
      const prefixed = selectedProject.sets.find((s) => s.name.toLowerCase() === `set ${clean}`)
      if (prefixed) return prefixed.id

      // 3. Partial match
      const partial = selectedProject.sets.find(
        (s) => s.name.toLowerCase().includes(clean) || clean.includes(s.name.toLowerCase()),
      )
      if (partial) return partial.id

      return undefined
    },
    [selectedProject],
  )

  // Validate each row for invalid week numbers, unrecognized sets, or negative numbers
  const rowValidation = useMemo(() => {
    return rows.map((r) => {
      const isWeekValid = r.weekNum !== null && Number.isInteger(r.weekNum) && r.weekNum >= 1 && r.weekNum <= 53
      const resolvedSetId = resolveSetId(r.setRaw)
      const isSetValid = Boolean(resolvedSetId)
      const hasAtLeastOneValue =
        r.output !== null || r.scrap !== null || r.oee !== null || r.cim1 !== null || r.cim2 !== null || r.cim3 !== null
      const hasNegativeValue =
        (r.output !== null && r.output < 0) ||
        (r.scrap !== null && r.scrap < 0) ||
        (r.oee !== null && r.oee < 0) ||
        (r.cim1 !== null && r.cim1 < 0) ||
        (r.cim2 !== null && r.cim2 < 0) ||
        (r.cim3 !== null && r.cim3 < 0)

      const errors: string[] = []
      if (!isWeekValid) errors.push('Week must be an integer between 1 and 53')
      if (!isSetValid) errors.push(`Unrecognized machine set "${r.setRaw}"`)
      if (!hasAtLeastOneValue) errors.push('At least one KPI value must be provided')
      if (hasNegativeValue) errors.push('KPI values cannot be negative')

      return {
        id: r.id,
        isWeekValid,
        isSetValid,
        hasAtLeastOneValue,
        hasNegativeValue,
        isValid: errors.length === 0,
        errors,
      }
    })
  }, [rows, resolveSetId])

  const invalidRowsCount = useMemo(() => {
    return rowValidation.filter((v) => !v.isValid).length
  }, [rowValidation])

  const validationMap = useMemo(() => {
    const map: Record<string, typeof rowValidation[0]> = {}
    for (const v of rowValidation) {
      map[v.id] = v
    }
    return map
  }, [rowValidation])

  const handleUploadSubmit = () => {
    if (!filters.projectId) {
      showError('Please select a project first.', 'No Project Selected')
      return
    }
    if (rows.length === 0) return

    if (kpiDefsQuery.isLoading) {
      showError('KPI definitions are still loading. Please wait a moment.', 'Loading Definitions')
      return
    }
    if (kpiDefsQuery.isError) {
      showError('KPI definitions could not be loaded. Please refresh before uploading.', 'Error')
      return
    }

    if (invalidRowsCount > 0) {
      showError(`Please resolve validation issues in ${invalidRowsCount} row(s) before uploading.`, 'Validation Errors')
      return
    }

    const recordsToCreate: KPIRecordBulkCreateItem[] = []

    for (const r of rows) {
      const week = r.weekNum || 1
      const setId = resolveSetId(r.setRaw)
      if (!setId) continue
      const recordDateObj = mondayOfISOWeek(filters.year, week)
      const recordDateStr = recordDateObj.toISOString().split('T')[0]

      const kpiValues: { key: string; val: number | null }[] = [
        { key: 'output', val: r.output },
        { key: 'scrap', val: r.scrap },
        { key: 'oee', val: r.oee },
        { key: 'cim1', val: r.cim1 },
        { key: 'cim2', val: r.cim2 },
        { key: 'cim3', val: r.cim3 },
      ]

      for (const item of kpiValues) {
        const kpiId = kpiMap[item.key]
        if (kpiId) {
          recordsToCreate.push({
            project_id: filters.projectId,
            set_id: setId,
            kpi_id: kpiId,
            record_date: recordDateStr,
            period: 'WEEKLY',
            numeric_value: item.val,
            is_missing: item.val === null,
          })
        }
      }
    }

    if (recordsToCreate.length === 0) {
      showError('No valid KPI records could be mapped. Check your KPI definitions and machine sets.', 'Upload Failed')
      return
    }

    bulkUploadMutation.mutate(recordsToCreate)
  }

  // Count unique weeks in pasted rows
  const uniqueWeeksCount = useMemo(() => {
    const weeks = new Set(rows.map((r) => r.weekNum).filter((w) => w !== null))
    return weeks.size > 0 ? weeks.size : rows.length
  }, [rows])

  if (isProjectsLoading) {
    return (
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-surface">
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 sm:p-8">
          <Card className="h-64 flex flex-col items-center justify-center gap-3">
            <Spinner size="md" />
            <p className="text-[14px] text-on-surface-variant font-medium">Loading projects and configurations...</p>
          </Card>
        </div>
      </main>
    )
  }

  if (projectsError) {
    return (
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-surface">
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 sm:p-8">
          <ErrorState error={projectsError} onRetry={fetchProjects} isRetrying={isProjectsLoading} />
        </div>
      </main>
    )
  }

  return (
    <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-surface">
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="max-w-[1440px] mx-auto w-full px-4 sm:px-8 py-6 sm:py-8 space-y-6">
          {/* Header & Title */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-on-surface tracking-tight">Bulk Data Entry</h1>
              <p className="text-sm text-on-surface-variant/70 mt-1">
                Copy tabular KPI data from Excel and paste it directly into the application
              </p>
            </div>

            {/* Last Updated Week Badge */}
            <div className="flex items-center gap-2">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-[13px] font-semibold">
                {projectRecordsQuery.isLoading ? (
                  <>
                    <Spinner size="sm" />
                    <span className="text-on-surface-variant text-[12px]">Checking recorded weeks...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>
                      {lastRecordedWeekInfo !== null
                        ? `Last updated: ${weekLabelFromNumber(lastRecordedWeekInfo)}`
                        : 'No data recorded yet'}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Project with No Sets Alert */}
          {selectedProject && (!selectedProject.sets || selectedProject.sets.length === 0) && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-800 text-[13px]">
              <div className="flex items-center gap-2.5">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                <div>
                  <p className="font-semibold text-amber-900">No machine sets configured for this project</p>
                  <p className="text-amber-700 text-[12px]">Please create at least one set in Project Management before pasting or uploading data.</p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => navigate('/projects')}
                className="py-1.5 px-3 text-xs shrink-0 self-start sm:self-auto flex items-center gap-1.5"
              >
                <span>Manage Sets</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          )}

          {/* KPI Definitions Error State */}
          {kpiDefsQuery.isError && (
            <ErrorState
              compact
              error={kpiDefsQuery.error}
              title="Failed to Load KPI Definitions"
              message="KPI definitions could not be retrieved from the server. Data mapping will not work until reloaded."
              onRetry={() => kpiDefsQuery.refetch()}
              isRetrying={kpiDefsQuery.isRefetching}
            />
          )}

          {/* Filter Bar */}
          <FilterBar
            projects={projects}
            filters={filters}
            onChange={setFilters}
            onWeekChange={(w, y) => setFilters((prev) => ({ ...prev, week: w, year: y }))}
            hideSet
            hideWeek
          />

          {/* Paste Zone — hides once data is pasted */}
          {rows.length === 0 && (
            <Card className="p-6">
              <div
                tabIndex={0}
                onPaste={handlePasteEvent}
                className="group relative flex flex-col items-center justify-center p-8 border-2 border-dashed border-outline-variant hover:border-primary focus:border-primary focus:bg-primary/5 rounded-xl transition-all cursor-pointer outline-none text-center bg-surface-container/30"
              >
                <div className="p-3 rounded-full bg-primary/10 text-primary mb-3 group-hover:scale-110 transition-transform">
                  <ClipboardPaste className="w-8 h-8" />
                </div>
                <h3 className="text-base font-semibold text-on-surface">Paste data from Excel here</h3>
                <p className="text-[12.5px] text-on-surface-variant/70 mt-1 max-w-md">
                  Click here and press <kbd className="px-1.5 py-0.5 bg-surface border rounded text-xs">Ctrl + V</kbd>{' '}
                  or paste tabular cells copied from Excel.
                </p>

                {/* Format Hint */}
                <div className="mt-4 p-2.5 rounded-lg bg-surface-container text-[11.5px] text-on-surface-variant border border-border-card flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>
                    <strong>Expected columns:</strong> Set | Week | Output | Scrap | OEE | CIM1 | CIM2 | CIM3
                  </span>
                </div>

                {/* Direct Paste Fallback Textarea */}
                <textarea
                  placeholder="Or paste text directly here..."
                  onChange={(e) => {
                    if (e.target.value) {
                      handlePasteText(e.target.value)
                      e.target.value = ''
                    }
                  }}
                  className="w-full mt-4 p-2.5 rounded-lg border border-outline-variant text-[12px] font-mono bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 opacity-40 hover:opacity-100 transition-opacity"
                  rows={2}
                />
              </div>

              {hasHeaderDetected && (
                <p className="mt-3 text-[12px] text-emerald-600 font-medium text-center">
                  Detected Excel header row and automatically excluded it.
                </p>
              )}
            </Card>
          )}

          {/* Editable Preview Table & Confirmation */}
          {rows.length > 0 && (
            <Card className="p-6 space-y-4">
              <div className="flex items-center justify-between gap-4 pb-3 border-b border-border-card">
                <div>
                  <h3 className="text-base font-semibold text-on-surface">
                    Data Preview ({rows.length} row{rows.length > 1 ? 's' : ''})
                  </h3>
                  <p className="text-[12px] text-on-surface-variant">
                    Review and edit cell values below before confirming upload
                  </p>
                </div>
                <Button
                  variant="secondary"
                  onClick={clearRows}
                  disabled={bulkUploadMutation.isPending}
                  className="py-1.5 text-[12.5px] flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Clear Data
                </Button>
              </div>

              {/* Validation Warning Alert if any row has errors */}
              {invalidRowsCount > 0 && (
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3 text-amber-800 text-[13px]">
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <p className="font-semibold text-amber-900">
                      {invalidRowsCount} row{invalidRowsCount > 1 ? 's have' : ' has'} validation issues
                    </p>
                    <p className="text-amber-700 text-[12.5px]">
                      Please correct the highlighted cells (e.g. week number 1-53, non-negative numbers, or unrecognized machine sets) before uploading.
                    </p>
                  </div>
                </div>
              )}

              {/* Upload Mutation Error Banner */}
              {bulkUploadMutation.isError && (
                <ErrorState
                  compact
                  error={bulkUploadMutation.error}
                  title="Bulk Upload Failed"
                  onRetry={handleUploadSubmit}
                  isRetrying={bulkUploadMutation.isPending}
                />
              )}

              {/* Table */}
              <div className="overflow-x-auto border border-border-card rounded-lg">
                <table className="w-full text-left text-[13px]">
                  <thead className="bg-surface-container text-on-surface-variant font-semibold text-[12px] uppercase tracking-wider">
                    <tr>
                      <th className="px-3 py-2.5 border-b">Set</th>
                      <th className="px-3 py-2.5 border-b">Week</th>
                      <th className="px-3 py-2.5 border-b">Output</th>
                      <th className="px-3 py-2.5 border-b">Scrap Rate (%)</th>
                      <th className="px-3 py-2.5 border-b">OEE (%)</th>
                      <th className="px-3 py-2.5 border-b">CIM-1 (%)</th>
                      <th className="px-3 py-2.5 border-b">CIM-2 (%)</th>
                      <th className="px-3 py-2.5 border-b">CIM-3 (%)</th>
                      <th className="px-3 py-2.5 border-b text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-card bg-white">
                    {rows.map((row) => {
                      const val = validationMap[row.id]
                      return (
                        <tr key={row.id} className="hover:bg-surface-container/30">
                          {/* Set */}
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              value={row.setRaw}
                              disabled={bulkUploadMutation.isPending}
                              onChange={(e) => updateCell(row.id, 'setRaw', e.target.value)}
                              title={val && !val.isSetValid ? 'Unrecognized set name for this project' : ''}
                              className={`w-24 px-2 py-1 border rounded text-[13px] bg-surface focus:outline-none disabled:opacity-60 ${
                                val && !val.isSetValid
                                  ? 'border-error bg-error/5 text-error font-medium focus:border-error'
                                  : 'border-outline-variant focus:border-primary'
                              }`}
                            />
                          </td>
                          {/* Week */}
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              value={row.weekNum ?? ''}
                              disabled={bulkUploadMutation.isPending}
                              onChange={(e) =>
                                updateCell(row.id, 'weekNum', e.target.value ? parseInt(e.target.value, 10) : null)
                              }
                              title={val && !val.isWeekValid ? 'Week must be an integer between 1 and 53' : ''}
                              className={`w-20 px-2 py-1 border rounded text-[13px] bg-surface focus:outline-none disabled:opacity-60 ${
                                val && !val.isWeekValid
                                  ? 'border-error bg-error/5 text-error font-medium focus:border-error'
                                  : 'border-outline-variant focus:border-primary'
                              }`}
                            />
                          </td>
                          {/* Output */}
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              step="100"
                              value={row.output ?? ''}
                              disabled={bulkUploadMutation.isPending}
                              onChange={(e) =>
                                updateCell(row.id, 'output', e.target.value ? parseFloat(e.target.value) : null)
                              }
                              placeholder="null"
                              className={`w-24 px-2 py-1 border rounded text-[13px] bg-surface focus:outline-none disabled:opacity-60 ${
                                row.output !== null && row.output < 0
                                  ? 'border-error bg-error/5 text-error'
                                  : 'border-outline-variant focus:border-primary'
                              }`}
                            />
                          </td>
                          {/* Scrap */}
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              step="0.1"
                              value={row.scrap ?? ''}
                              disabled={bulkUploadMutation.isPending}
                              onChange={(e) =>
                                updateCell(row.id, 'scrap', e.target.value ? parseFloat(e.target.value) : null)
                              }
                              placeholder="null"
                              className={`w-24 px-2 py-1 border rounded text-[13px] bg-surface focus:outline-none disabled:opacity-60 ${
                                row.scrap !== null && row.scrap < 0
                                  ? 'border-error bg-error/5 text-error'
                                  : 'border-outline-variant focus:border-primary'
                              }`}
                            />
                          </td>
                          {/* OEE */}
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              step="5"
                              value={row.oee ?? ''}
                              disabled={bulkUploadMutation.isPending}
                              onChange={(e) =>
                                updateCell(row.id, 'oee', e.target.value ? parseFloat(e.target.value) : null)
                              }
                              placeholder="null"
                              className={`w-24 px-2 py-1 border rounded text-[13px] bg-surface focus:outline-none disabled:opacity-60 ${
                                row.oee !== null && row.oee < 0
                                  ? 'border-error bg-error/5 text-error'
                                  : 'border-outline-variant focus:border-primary'
                              }`}
                            />
                          </td>
                          {/* CIM1 */}
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              step="5"
                              value={row.cim1 ?? ''}
                              disabled={bulkUploadMutation.isPending}
                              onChange={(e) =>
                                updateCell(row.id, 'cim1', e.target.value ? parseFloat(e.target.value) : null)
                              }
                              placeholder="null"
                              className={`w-24 px-2 py-1 border rounded text-[13px] bg-surface focus:outline-none disabled:opacity-60 ${
                                row.cim1 !== null && row.cim1 < 0
                                  ? 'border-error bg-error/5 text-error'
                                  : 'border-outline-variant focus:border-primary'
                              }`}
                            />
                          </td>
                          {/* CIM2 */}
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              step="5"
                              value={row.cim2 ?? ''}
                              disabled={bulkUploadMutation.isPending}
                              onChange={(e) =>
                                updateCell(row.id, 'cim2', e.target.value ? parseFloat(e.target.value) : null)
                              }
                              placeholder="null"
                              className={`w-24 px-2 py-1 border rounded text-[13px] bg-surface focus:outline-none disabled:opacity-60 ${
                                row.cim2 !== null && row.cim2 < 0
                                  ? 'border-error bg-error/5 text-error'
                                  : 'border-outline-variant focus:border-primary'
                              }`}
                            />
                          </td>
                          {/* CIM3 */}
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              step="5"
                              value={row.cim3 ?? ''}
                              disabled={bulkUploadMutation.isPending}
                              onChange={(e) =>
                                updateCell(row.id, 'cim3', e.target.value ? parseFloat(e.target.value) : null)
                              }
                              placeholder="null"
                              className={`w-24 px-2 py-1 border rounded text-[13px] bg-surface focus:outline-none disabled:opacity-60 ${
                                row.cim3 !== null && row.cim3 < 0
                                  ? 'border-error bg-error/5 text-error'
                                  : 'border-outline-variant focus:border-primary'
                              }`}
                            />
                          </td>
                          {/* Action */}
                          <td className="px-3 py-2 text-right">
                            <button
                              onClick={() => deleteRow(row.id)}
                              disabled={bulkUploadMutation.isPending}
                              className="p-1.5 text-on-surface-variant/40 hover:text-error hover:bg-error/10 rounded transition-colors disabled:opacity-40"
                              title="Delete row"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Confirmation Button */}
              <div className="flex items-center justify-end pt-3 border-t border-border-card">
                <Button
                  onClick={handleUploadSubmit}
                  loading={bulkUploadMutation.isPending}
                  disabled={
                    bulkUploadMutation.isPending ||
                    rows.length === 0 ||
                    invalidRowsCount > 0 ||
                    kpiDefsQuery.isLoading ||
                    (selectedProject?.sets?.length ?? 0) === 0
                  }
                  className="py-2.5 px-6 font-semibold flex items-center gap-2 text-[14px]"
                >
                  <UploadCloud className="w-4 h-4" />
                  Upload [{uniqueWeeksCount}] Weeks of Data
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </main>
  )
}
