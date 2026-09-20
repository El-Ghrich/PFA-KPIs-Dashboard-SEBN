import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { projectsApi } from "../api/projects";
import { kpisApi } from "../api/kpis";
import { highlightsApi } from "../api/highlights";
import { Card } from "../components/ui/Card";
import { Dropdown } from "../components/ui/Dropdown";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { Spinner } from "../components/ui/Spinner";
import { useToast } from "../contexts/ToastContext";
import {
  HighlightEditor,
  type HighlightEditorItem,
} from "../components/HighlightEditor";
import { YEARS } from "../lib/constants";
import { useSettings } from "../hooks/useSettings";
import {
  getCurrentISOWeek,
  isoWeekRange,
  mondayOfISOWeekString,
  weekLabelFromNumber,
} from "../lib/isoDate";
import { formatDateRange } from "../lib/format";
import type { KPIRecord } from "../types";
import { Layers, Save, ArrowRight } from "lucide-react";

const WEEK_OPTIONS = Array.from({ length: 53 }, (_, i) => ({
  value: i + 1,
  label: weekLabelFromNumber(i + 1),
}));

const YEAR_OPTIONS = YEARS.map((y) => ({ value: Number(y), label: y }));



export default function WeeklyEntry() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();

  const [projectId, setProjectId] = useState("");
  const [setId, setSetId] = useState("");
  const { settings } = useSettings();
  const [year, setYear] = useState(settings.defaultYear);
  const [week, setWeek] = useState(getCurrentISOWeek());
  const [values, setValues] = useState<Record<string, string>>({});
  const [good, setGood] = useState<HighlightEditorItem[]>([]);
  const [bad, setBad] = useState<HighlightEditorItem[]>([]);

  const projectsQuery = useQuery({
    queryKey: ["projects"],
    queryFn: () => projectsApi.list(1, 100),
  });
  const projects = projectsQuery.data?.items ?? [];

  const selectedProject = projects.find((p) => p.id === projectId);
  const projectSets = selectedProject?.sets ?? [];

  useEffect(() => {
    if (projectId || projects.length === 0) return;
    setProjectId(projects[0].id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, projects]);

  useEffect(() => {
    if (projectSets.length === 0) {
      setSetId("");
    } else if (!projectSets.some((s) => s.id === setId)) {
      setSetId(projectSets[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, projectSets]);

  const definitionsQuery = useQuery({
    queryKey: ["kpi-definitions"],
    queryFn: () => kpisApi.getDefinitions(),
  });
  const definitions = definitionsQuery.data ?? [];

  const enabled = !!projectId && !!setId;
  const recordDate = useMemo(
    () => (enabled ? mondayOfISOWeekString(year, week) : ""),
    [enabled, year, week],
  );
  const weekRange = useMemo(() => isoWeekRange(year, week), [year, week]);

  // Fetch KPI records for active set
  const recordsQuery = useQuery({
    queryKey: ["weekly-records", projectId, setId, year, week],
    queryFn: () =>
      kpisApi.getRecords(projectId, "WEEKLY", year, week, undefined, setId),
    enabled,
  });
  const records = recordsQuery.data ?? [];

  // Fetch project-level highlights
  const highlightsQuery = useQuery({
    queryKey: ["weekly-highlights", projectId, year, week],
    queryFn: () => highlightsApi.list(projectId, "WEEKLY", year, week),
    enabled: Boolean(projectId),
  });
  const existingHighlights = highlightsQuery.data ?? [];

  useEffect(() => {
    if (!enabled || recordsQuery.isLoading) return;
    const sorted = [...records].sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    );
    const next: Record<string, string> = {};
    for (const rec of sorted) {
      next[rec.kpi_id] =
        rec.numeric_value != null ? String(rec.numeric_value) : "";
    }
    setValues(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, setId, records, recordsQuery.isLoading]);

  useEffect(() => {
    console.log("existingHighlights:", existingHighlights);
    if (!projectId || highlightsQuery.isLoading) return;
    const g: HighlightEditorItem[] = [];
    const b: HighlightEditorItem[] = [];
    for (const h of existingHighlights) {
      const item = {
        localId: crypto.randomUUID(),
        existingId: h.id,
        text: h.value ?? "",
      };
      if (h.status === "GOOD") g.push(item);
      else b.push(item);
    }
    setGood(g);
    setBad(b);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, existingHighlights, highlightsQuery.isLoading]);

  const recordsByKpi = useMemo(() => {
    const sorted = [...records].sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    );
    const map: Record<string, KPIRecord> = {};
    for (const rec of sorted) map[rec.kpi_id] = rec;
    return map;
  }, [records]);

  const validationErrors = useMemo(() => {
    const errs: Record<string, string> = {};
    for (const def of definitions) {
      console.log(values);
      const raw = values[def.id];
      console.log("first trim");
      if (!raw || raw.trim() === "") continue;
      console.log("end first trim");
      const num = Number(raw);
      if (isNaN(num)) {
        errs[def.id] = "Must be a valid number";
      } else if (num < 0) {
        errs[def.id] = "Value cannot be negative";
      } else if (
        def.unit === "%" ||
        def.name.toLowerCase().includes("rate") ||
        def.name.toLowerCase().includes("oee") ||
        def.name.toLowerCase().includes("scrap")
      ) {
        if (num > 100) {
          errs[def.id] = "Percentage cannot exceed 100%";
        }
      }
    }
    return errs;
  }, [definitions, values]);

  const hasValidationErrors = Object.keys(validationErrors).length > 0;

  const saveMutation = useMutation({
    mutationFn: async () => {
      const createItems: {
        project_id: string;
        set_id: string;
        kpi_id: string;
        record_date: string;
        period: "WEEKLY";
        numeric_value: number;
      }[] = [];
      const patches: { id: string; numeric_value: number }[] = [];

      for (const def of definitions) {
        console.log(definitions);
        const raw = values[def.id] ?? "";
        console.log(raw);
        const numeric = Number(raw);
        if (raw.trim() === "" || Number.isNaN(numeric)) continue;
        const existing = recordsByKpi[def.id];
        if (existing) patches.push({ id: existing.id, numeric_value: numeric });
        else
          createItems.push({
            project_id: projectId,
            set_id: setId,
            kpi_id: def.id,
            record_date: recordDate,
            period: "WEEKLY",
            numeric_value: numeric,
          });
      }

      if (createItems.length > 0) {
        await kpisApi.createRecordsBulk(createItems);
      }

      for (const p of patches) {
        await kpisApi.updateRecord(p.id, { numeric_value: p.numeric_value });
      }

      const highlightGroups: ["GOOD" | "BAD", HighlightEditorItem[]][] = [
        ["GOOD", good],
        ["BAD", bad],
      ];

      for (const [status, items] of highlightGroups) {
        for (const it of items) {
          const text = (it.text ?? "").trim();
          console.log("text:", text);
          console.log("it.existingId:", it.existingId);
          if (it.existingId) {
            if (text)
              await highlightsApi.update(it.existingId, {
                value: text,
                status,
              });
            else await highlightsApi.remove(it.existingId);
          } else if (text) {
            await highlightsApi.create({
              project_id: projectId,
              record_date: recordDate,
              period: "WEEKLY",
              value: text,
              status,
            });
          }
        }
      }
    },
    onSuccess: async () => {
      showSuccess(`Saved data for ${selectedSet?.name || "set"} successfully!`);
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["dashboard", projectId, year],
        }),
        recordsQuery.refetch(),
        highlightsQuery.refetch(),
      ]);
    },
    onError: (err) => {
      showError(err, "Failed to Save KPI Entry");
    },
  });

  const selectedSet = projectSets.find((s) => s.id === setId);
  const anyExisting = records.length > 0;
  const queryError =
    projectsQuery.error ||
    definitionsQuery.error ||
    recordsQuery.error ||
    highlightsQuery.error;
  const isRetryingQueries =
    projectsQuery.isRefetching ||
    definitionsQuery.isRefetching ||
    recordsQuery.isRefetching ||
    highlightsQuery.isRefetching;

  return (
    <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-surface">
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="max-w-[1440px] mx-auto w-full px-4 sm:px-8 py-6 sm:py-8">
          <header className="mb-6">
            <h1 className="text-2xl font-semibold text-on-surface">
              Weekly KPI Data Entry
            </h1>
            <p className="text-sm text-on-surface-variant mt-1">
              Select a project and machine set to record or update weekly
              production KPIs and project highlights.
            </p>
          </header>

          {/* Project & Date Selector Card */}
          <Card className="mb-6">
            <div className="flex flex-wrap items-end gap-4">
              <Dropdown<string>
                label="Project"
                value={projectId}
                options={projects.map((p) => ({
                  value: p.id,
                  label: `${p.name} (${p.location})`,
                }))}
                onChange={setProjectId}
                disabled={saveMutation.isPending}
                className="min-w-[220px]"
              />
              <Dropdown<number>
                label="ISO Year"
                value={year}
                options={YEAR_OPTIONS}
                onChange={setYear}
                disabled={saveMutation.isPending}
              />
              <Dropdown<number>
                label="ISO Week"
                value={week}
                options={WEEK_OPTIONS}
                onChange={setWeek}
                disabled={saveMutation.isPending}
              />
              {enabled && (
                <p className="text-[13px] text-on-surface-variant font-medium pb-2">
                  {formatDateRange(weekRange.monday, weekRange.sunday, true)}
                </p>
              )}
            </div>
          </Card>

          {queryError ? (
            <ErrorState
              error={queryError}
              isRetrying={isRetryingQueries}
              onRetry={() => {
                projectsQuery.refetch();
                definitionsQuery.refetch();
                if (enabled) recordsQuery.refetch();
                if (projectId) highlightsQuery.refetch();
              }}
            />
          ) : projectsQuery.isLoading ? (
            <Card className="h-64 flex flex-col items-center justify-center gap-3">
              <Spinner size="md" />
              <p className="text-[14px] text-on-surface-variant font-medium">
                Loading projects and configurations...
              </p>
            </Card>
          ) : !projectId ? (
            <EmptyState
              className="h-64"
              message="Select a project to load data"
            />
          ) : projectSets.length === 0 ? (
            <Card className="p-8 text-center flex flex-col items-center justify-center gap-4">
              <div className="p-3 rounded-full bg-amber-500/10 text-amber-600">
                <Layers className="w-8 h-8" />
              </div>
              <div className="space-y-1 max-w-md">
                <h3 className="text-base font-semibold text-on-surface">
                  No Sets Configured
                </h3>
                <p className="text-sm text-on-surface-variant">
                  Project{" "}
                  <span className="font-semibold text-on-surface">
                    {selectedProject?.name}
                  </span>{" "}
                  does not have any machine sets configured yet. A set is
                  required to record weekly KPIs.
                </p>
              </div>
              <Button
                onClick={() => navigate("/projects")}
                variant="outline"
                className="flex items-center gap-2"
              >
                <span>Manage Sets in Project Management</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Card>
          ) : definitionsQuery.isLoading ||
            recordsQuery.isLoading ||
            highlightsQuery.isLoading ? (
            <Card className="h-64 flex flex-col items-center justify-center gap-3">
              <Spinner size="md" />
              <p className="text-[14px] text-on-surface-variant font-medium">
                Loading week data for {selectedProject?.name} (
                {selectedSet?.name || "Set"})...
              </p>
            </Card>
          ) : (
            <Card>
              {/* Window-like Set Selector Bar */}
              <div className="mb-6 bg-surface-container/60 p-1.5 rounded-xl border border-border-card flex items-center justify-between gap-2 overflow-x-auto">
                <div className="flex items-center gap-1.5">
                  <div className="px-3 py-1 text-xs font-semibold uppercase tracking-wider text-on-surface-variant/70 flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-primary" />
                    Select Set:
                  </div>
                  {projectSets.map((s) => {
                    const isActive = s.id === setId;
                    return (
                      <button
                        key={s.id}
                        disabled={saveMutation.isPending}
                        onClick={() => setSetId(s.id)}
                        className={`
                          px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200 flex items-center gap-2 whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed
                          ${
                            isActive
                              ? "bg-white text-primary shadow-sm border border-primary/20 scale-[1.02]"
                              : "text-on-surface-variant hover:text-on-surface hover:bg-white/60"
                          }
                        `}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${isActive ? "bg-primary" : "bg-on-surface-variant/30"}`}
                        />
                        {s.name}
                      </button>
                    );
                  })}
                </div>

                {anyExisting && (
                  <span className="text-[11px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full bg-primary/10 text-primary whitespace-nowrap mr-2">
                    Editing existing data for {selectedSet?.name}
                  </span>
                )}
              </div>

              {/* Header */}
              <div className="flex items-center justify-between mb-4 border-b border-border-card pb-3">
                <h2 className="text-[15px] font-semibold text-on-surface">
                  {selectedProject?.name} ·{" "}
                  <span className="text-primary font-bold">
                    {selectedSet?.name}
                  </span>{" "}
                  · {weekLabelFromNumber(week)} (
                  {formatDateRange(weekRange.monday, weekRange.sunday, true)})
                </h2>
              </div>

              {/* KPI Input Fields */}
              {definitions.length === 0 ? (
                <EmptyState
                  className="h-40"
                  message="No KPI definitions found"
                />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                  {definitions.map((def) => {
                    const isPercentage =
                      def.unit === "%" ||
                      def.name.toLowerCase().includes("rate") ||
                      def.name.toLowerCase().includes("oee") ||
                      def.name.toLowerCase().includes("scrap");
                    return (
                      <Input
                        key={def.id}
                        id={`kpi-${def.id}`}
                        label={def.name}
                        type="number"
                        inputMode="decimal"
                        min="0"
                        max={isPercentage ? "100" : undefined}
                        step={isPercentage ? "0.1" : "1"}
                        disabled={saveMutation.isPending}
                        value={values[def.id] ?? ""}
                        error={validationErrors[def.id]}
                        suffix={
                          <span className="text-[12px] font-semibold text-on-surface-variant/60">
                            {def.unit}
                          </span>
                        }
                        onChange={(e) =>
                          setValues((prev) => ({
                            ...prev,
                            [def.id]: e.target.value,
                          }))
                        }
                      />
                    );
                  })}
                </div>
              )}

              {/* Project Highlights Section */}
              <div className="mb-6 pt-4 border-t border-border-card">
                <HighlightEditor
                  good={good}
                  bad={bad}
                  disabled={saveMutation.isPending}
                  onChange={(status, items) =>
                    status === "GOOD" ? setGood(items) : setBad(items)
                  }
                />
              </div>

              {/* Inline Save Error Banner if mutation failed */}
              {saveMutation.isError && (
                <div className="mb-4">
                  <ErrorState
                    compact
                    error={saveMutation.error}
                    title="Failed to Save KPI Entry"
                    onRetry={() => saveMutation.mutate()}
                    isRetrying={saveMutation.isPending}
                  />
                </div>
              )}

              {/* Save Bar */}
              <div className="flex items-center gap-3 pt-2">
                <Button
                  onClick={() => saveMutation.mutate()}
                  loading={saveMutation.isPending}
                  disabled={saveMutation.isPending || hasValidationErrors}
                  className="flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {anyExisting
                    ? `Update ${selectedSet?.name}`
                    : `Save ${selectedSet?.name}`}
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </main>
  );
}
