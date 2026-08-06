import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { projectsApi } from '../api/projects'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { Dropdown } from '../components/ui/Dropdown'
import { EmptyState } from '../components/ui/EmptyState'
import { Modal } from '../components/ui/Modal'
import { ConfirmModal } from '../components/ui/ConfirmModal'
import { LOCATIONS } from '../lib/constants'
import { FolderKanban, Plus, Pencil, Trash2, Layers, MapPin } from 'lucide-react'
import type { Project, ProjectSet } from '../types'

export default function ProjectManagement() {
  const queryClient = useQueryClient()
  const [locationFilter, setLocationFilter] = useState('All')

  // Modals state
  const [isAddProjectOpen, setIsAddProjectOpen] = useState(false)
  const [projectName, setProjectName] = useState('')
  const [projectLocation, setProjectLocation] = useState('Morocco')
  const [initialSetsCount, setInitialSetsCount] = useState(2)

  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [editName, setEditName] = useState('')
  const [editLocation, setEditLocation] = useState('')

  const [deletingProject, setDeletingProject] = useState<Project | null>(null)

  // Set modals
  const [addingSetToProject, setAddingSetToProject] = useState<Project | null>(null)
  const [newSetName, setNewSetName] = useState('')

  const [editingSet, setEditingSet] = useState<{ project: Project; set: ProjectSet } | null>(null)
  const [editSetName, setEditSetName] = useState('')

  const [deletingSet, setDeletingSet] = useState<{ project: Project; set: ProjectSet } | null>(null)

  // Fetch projects query
  const { data, isLoading } = useQuery({
    queryKey: ['projects', locationFilter],
    queryFn: () => projectsApi.list(1, 100, locationFilter),
  })
  const projects = data?.items ?? []

  // Create Project mutation
  const createProjectMutation = useMutation({
    mutationFn: () => projectsApi.create({
      name: projectName.trim(),
      location: projectLocation,
      initial_sets_count: initialSetsCount,
    }),
    onSuccess: () => {
      setIsAddProjectOpen(false)
      setProjectName('')
      setProjectLocation('Morocco')
      setInitialSetsCount(2)
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
  })

  // Edit Project mutation
  const updateProjectMutation = useMutation({
    mutationFn: () => {
      if (!editingProject) return Promise.reject()
      return projectsApi.update(editingProject.id, {
        name: editName.trim(),
        location: editLocation,
      })
    },
    onSuccess: () => {
      setEditingProject(null)
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
  })

  // Soft Delete Project mutation
  const deleteProjectMutation = useMutation({
    mutationFn: () => {
      if (!deletingProject) return Promise.reject()
      return projectsApi.softDelete(deletingProject.id)
    },
    onSuccess: () => {
      setDeletingProject(null)
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
  })

  // Add Set mutation
  const addSetMutation = useMutation({
    mutationFn: () => {
      if (!addingSetToProject) return Promise.reject()
      return projectsApi.addSet(addingSetToProject.id, newSetName.trim())
    },
    onSuccess: () => {
      setAddingSetToProject(null)
      setNewSetName('')
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
  })

  // Edit Set mutation
  const updateSetMutation = useMutation({
    mutationFn: () => {
      if (!editingSet) return Promise.reject()
      return projectsApi.updateSet(editingSet.project.id, editingSet.set.id, editSetName.trim())
    },
    onSuccess: () => {
      setEditingSet(null)
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
  })

  // Delete Set mutation
  const deleteSetMutation = useMutation({
    mutationFn: () => {
      if (!deletingSet) return Promise.reject()
      return projectsApi.softDeleteSet(deletingSet.project.id, deletingSet.set.id)
    },
    onSuccess: () => {
      setDeletingSet(null)
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
  })

  return (
    <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-surface">
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="max-w-[1440px] mx-auto w-full px-4 sm:px-8 py-6 sm:py-8">

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-on-surface flex items-center gap-2">
                <FolderKanban className="w-6 h-6 text-primary" />
                Project & Set Management
              </h1>
              <p className="text-sm text-on-surface-variant mt-1">
                Manage production projects, locations, and their associated machine sets.
              </p>
            </div>
            <Button
              onClick={() => setIsAddProjectOpen(true)}
              className="self-start sm:self-auto flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Project
            </Button>
          </div>

          {/* Filter Bar */}
          <Card className="mb-6">
            <div className="flex items-center gap-4">
              <Dropdown<string>
                label="Location Filter"
                value={locationFilter}
                options={LOCATIONS.map(l => ({ value: l, label: l }))}
                onChange={setLocationFilter}
                className="min-w-[180px]"
              />
              <span className="text-xs text-on-surface-variant/70 self-end pb-2">
                Showing {projects.length} project{projects.length === 1 ? '' : 's'}
              </span>
            </div>
          </Card>

          {/* Projects Grid */}
          {isLoading ? (
            <EmptyState className="h-64" message="Loading projects..." />
          ) : projects.length === 0 ? (
            <EmptyState className="h-64" message="No projects found for the selected location" />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <Card key={project.id} className="flex flex-col justify-between hover:shadow-md transition-shadow">
                  <div>
                    {/* Project Title & Badge */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <h3 className="text-lg font-semibold text-on-surface truncate">{project.name}</h3>
                        <div className="flex items-center gap-1 text-xs text-on-surface-variant/70 mt-0.5">
                          <MapPin className="w-3.5 h-3.5 text-primary" />
                          <span>{project.location || 'N/A'}</span>
                        </div>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200">
                        {project.status}
                      </span>
                    </div>

                    {/* Sets Section */}
                    <div className="border-t border-border-card pt-3 mt-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider flex items-center gap-1">
                          <Layers className="w-3.5 h-3.5 text-primary" />
                          Sets ({project.sets?.length ?? 0})
                        </span>
                        <button
                          onClick={() => {
                            setAddingSetToProject(project)
                            setNewSetName(`Set ${(project.sets?.length ?? 0) + 1}`)
                          }}
                          className="text-xs font-medium text-primary hover:underline flex items-center gap-0.5"
                          title="Add a new set to this project"
                        >
                          <Plus className="w-3.5 h-3.5" /> Add Set
                        </button>
                      </div>

                      {/* Sets Pills */}
                      <div className="flex flex-wrap gap-1.5 min-h-[32px] items-center">
                        {project.sets && project.sets.length > 0 ? (
                          project.sets.map((set) => (
                            <div
                              key={set.id}
                              className="group flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface border border-border-card text-xs font-medium text-on-surface"
                            >
                              <span>{set.name}</span>
                              <button
                                onClick={() => {
                                  setEditingSet({ project, set })
                                  setEditSetName(set.name)
                                }}
                                className="text-on-surface-variant/40 hover:text-primary transition-colors"
                                title="Rename set"
                              >
                                <Pencil className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => setDeletingSet({ project, set })}
                                className="text-on-surface-variant/40 hover:text-error transition-colors"
                                title="Remove set"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          ))
                        ) : (
                          <span className="text-xs text-on-surface-variant/50 italic">No sets added yet</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Project Actions */}
                  <div className="border-t border-border-card pt-3 mt-4 flex items-center justify-end gap-2">
                    <button
                      onClick={() => {
                        setEditingProject(project)
                        setEditName(project.name)
                        setEditLocation(project.location || 'Morocco')
                      }}
                      className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-surface-container rounded-lg transition-colors text-xs font-medium flex items-center gap-1"
                    >
                      <Pencil className="w-4 h-4" /> Edit
                    </button>
                    <button
                      onClick={() => setDeletingProject(project)}
                      className="p-1.5 text-on-surface-variant hover:text-error hover:bg-error/5 rounded-lg transition-colors text-xs font-medium flex items-center gap-1"
                    >
                      <Trash2 className="w-4 h-4" /> Delete
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Add Project Modal ─────────────────────────────── */}
      <Modal
        open={isAddProjectOpen}
        onClose={() => setIsAddProjectOpen(false)}
        title="Add New Project"
      >
        <div className="space-y-4">
          <Input
            id="proj-name"
            label="Project Name"
            placeholder="e.g. MEB40"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
          />
          <Dropdown<string>
            label="Location"
            value={projectLocation}
            options={LOCATIONS.filter(l => l !== 'All').map(l => ({ value: l, label: l }))}
            onChange={setProjectLocation}
          />
          <Input
            id="initial-sets"
            label="Initial Sets Count"
            type="number"
            min={1}
            max={20}
            value={initialSetsCount}
            onChange={(e) => setInitialSetsCount(Number(e.target.value))}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setIsAddProjectOpen(false)}>Cancel</Button>
            <Button
              disabled={!projectName.trim()}
              loading={createProjectMutation.isPending}
              onClick={() => createProjectMutation.mutate()}
            >
              Create Project
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Edit Project Modal ────────────────────────────── */}
      <Modal
        open={Boolean(editingProject)}
        onClose={() => setEditingProject(null)}
        title="Edit Project"
      >
        <div className="space-y-4">
          <Input
            id="edit-proj-name"
            label="Project Name"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
          />
          <Dropdown<string>
            label="Location"
            value={editLocation}
            options={LOCATIONS.filter(l => l !== 'All').map(l => ({ value: l, label: l }))}
            onChange={setEditLocation}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setEditingProject(null)}>Cancel</Button>
            <Button
              disabled={!editName.trim()}
              loading={updateProjectMutation.isPending}
              onClick={() => updateProjectMutation.mutate()}
            >
              Save Changes
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Add Set Modal ─────────────────────────────────── */}
      <Modal
        open={Boolean(addingSetToProject)}
        onClose={() => setAddingSetToProject(null)}
        title={`Add Set to ${addingSetToProject?.name}`}
      >
        <div className="space-y-4">
          <Input
            id="new-set-name"
            label="Set Name"
            placeholder="e.g. Set 4"
            value={newSetName}
            onChange={(e) => setNewSetName(e.target.value)}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setAddingSetToProject(null)}>Cancel</Button>
            <Button
              disabled={!newSetName.trim()}
              loading={addSetMutation.isPending}
              onClick={() => addSetMutation.mutate()}
            >
              Add Set
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Edit Set Modal ────────────────────────────────── */}
      <Modal
        open={Boolean(editingSet)}
        onClose={() => setEditingSet(null)}
        title="Rename Set"
      >
        <div className="space-y-4">
          <Input
            id="edit-set-name"
            label="Set Name"
            value={editSetName}
            onChange={(e) => setEditSetName(e.target.value)}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setEditingSet(null)}>Cancel</Button>
            <Button
              disabled={!editSetName.trim()}
              loading={updateSetMutation.isPending}
              onClick={() => updateSetMutation.mutate()}
            >
              Save Set Name
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Delete Project Confirmation Modal ─────────────── */}
      <ConfirmModal
        open={Boolean(deletingProject)}
        onCancel={() => setDeletingProject(null)}
        onConfirm={() => deleteProjectMutation.mutate()}
        title="Delete Project"
        description={`Are you sure you want to soft delete project "${deletingProject?.name}"? Its associated sets will also be hidden.`}
        confirmLabel="Delete Project"
        cancelLabel="Cancel"
        variant="delete"
        loading={deleteProjectMutation.isPending}
      />

      {/* ── Delete Set Confirmation Modal ─────────────────── */}
      <ConfirmModal
        open={Boolean(deletingSet)}
        onCancel={() => setDeletingSet(null)}
        onConfirm={() => deleteSetMutation.mutate()}
        title="Remove Set"
        description={`Are you sure you want to remove "${deletingSet?.set.name}" from project "${deletingSet?.project.name}"?`}
        confirmLabel="Remove Set"
        cancelLabel="Cancel"
        variant="delete"
        loading={deleteSetMutation.isPending}
      />
    </main>
  )
}
