import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { takeawaysApi } from '../../api/takeaways'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { EmptyState } from '../../components/ui/EmptyState'
import { ErrorState } from '../../components/ui/ErrorState'
import { ConfirmModal } from '../../components/ui/ConfirmModal'
import { Lightbulb, Plus, Trash2, X } from 'lucide-react'
import type { KeyTakeaway } from '../../types'

interface KeyTakeawaysSectionProps {
  projectId: string
  projectName?: string
}

export function KeyTakeawaysSection({ projectId, projectName }: KeyTakeawaysSectionProps) {
  const { user } = useAuth()
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN'
  const queryClient = useQueryClient()
  const { showSuccess, showError } = useToast()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [takeawayInputs, setTakeawayInputs] = useState<string[]>([''])
  const [deleteTarget, setDeleteTarget] = useState<KeyTakeaway | null>(null)

  const query = useQuery({
    queryKey: ['takeaways', projectId],
    queryFn: () => takeawaysApi.list(projectId),
    enabled: Boolean(projectId),
  })
  const takeaways = query.data?.items ?? []

  const createBulkMutation = useMutation({
    mutationFn: (validContents: string[]) => takeawaysApi.createBulk(projectId, validContents),
    onSuccess: (created) => {
      showSuccess(`Added ${created.length} key takeaway${created.length > 1 ? 's' : ''}!`)
      setIsModalOpen(false)
      setTakeawayInputs([''])
      queryClient.invalidateQueries({ queryKey: ['takeaways', projectId] })
    },
    onError: (err) => showError(err, 'Failed to Add Key Takeaways'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => takeawaysApi.delete(id),
    onSuccess: () => {
      showSuccess('Key takeaway deleted.')
      setDeleteTarget(null)
      queryClient.invalidateQueries({ queryKey: ['takeaways', projectId] })
    },
    onError: (err) => showError(err, 'Failed to Delete Key Takeaway'),
  })

  const handleAddInputRow = () => {
    setTakeawayInputs((prev) => [...prev, ''])
  }

  const handleRemoveInputRow = (index: number) => {
    setTakeawayInputs((prev) => prev.filter((_, i) => i !== index))
  }

  const handleInputChange = (index: number, value: string) => {
    setTakeawayInputs((prev) => {
      const next = [...prev]
      next[index] = value
      return next
    })
  }

  const handleSaveBulk = () => {
    const valid = takeawayInputs.map((s) => s.trim()).filter((s) => s.length > 0)
    if (valid.length === 0) return
    createBulkMutation.mutate(valid)
  }

  return (
    <div className="mt-8">
      <Card>
        {/* Section Header */}
        <div className="flex items-center justify-between gap-4 mb-5 pb-3 border-b border-border-card">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600">
              <Lightbulb className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-on-surface">Key Takeaways</h3>
              <p className="text-[12px] text-on-surface-variant/70">
                Overall project highlights, achievements, and strategic notes
              </p>
            </div>
          </div>

          {isAdmin && (
            <Button
              onClick={() => setIsModalOpen(true)}
              className="py-1.5 px-3 text-[12.5px] font-semibold flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Add Takeaways
            </Button>
          )}
        </div>

        {/* List of Takeaways */}
        {query.isError ? (
          <ErrorState error={query.error} onRetry={query.refetch} compact />
        ) : query.isLoading ? (
          <EmptyState className="h-32" message="Loading key takeaways..." />
        ) : takeaways.length === 0 ? (
          <EmptyState
            className="h-32"
            message={`No key takeaways recorded yet for ${projectName || 'this project'}.`}
          />
        ) : (
          <div className="divide-y divide-border-card">
            {takeaways.map((item) => {
              const formattedDate = new Date(item.created_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })

              return (
                <div
                  key={item.id}
                  className="py-3.5 flex items-start justify-between gap-4 group hover:bg-surface-container/30 px-2 rounded-lg transition-colors"
                >
                  {/* Left: Bullet & Content */}
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0" />
                    <p className="text-[13.5px] font-medium text-on-surface leading-relaxed break-words">
                      {item.content}
                    </p>
                  </div>

                  {/* Right: Date of Insertion & Admin Delete */}
                  <div className="flex items-center gap-3 shrink-0 self-start pt-0.5">
                    <span className="text-[11.5px] font-semibold text-on-surface-variant/60 tracking-tight select-none">
                      {formattedDate}
                    </span>

                    {isAdmin && (
                      <button
                        onClick={() => setDeleteTarget(item)}
                        title="Delete key takeaway"
                        className="p-1.5 text-on-surface-variant/40 hover:text-error hover:bg-error/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      {/* Add Bulk Key Takeaways Modal */}
      <Modal
        open={isModalOpen}
        title="Add Key Takeaways"
        onClose={() => {
          setIsModalOpen(false)
          setTakeawayInputs([''])
        }}
      >
        <div className="space-y-4">
          <p className="text-[12.5px] text-on-surface-variant">
            Enter key notes or project highlights. You can add multiple takeaways to submit them together.
          </p>

          <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
            {takeawayInputs.map((val, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  value={val}
                  onChange={(e) => handleInputChange(idx, e.target.value)}
                  placeholder={`Takeaway #${idx + 1}...`}
                  className="flex-1 px-3 py-2 rounded-lg border border-outline-variant text-[13.5px] text-on-surface bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-colors"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && val.trim()) {
                      e.preventDefault()
                      handleAddInputRow()
                    }
                  }}
                />
                {takeawayInputs.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveInputRow(idx)}
                    className="p-2 text-on-surface-variant/50 hover:text-error hover:bg-error/5 rounded-lg transition-colors shrink-0"
                    title="Remove item"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <Button
            type="button"
            variant="secondary"
            onClick={handleAddInputRow}
            className="w-full py-2 text-[12.5px] font-semibold border-dashed flex items-center justify-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Another Takeaway
          </Button>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border-card">
            <Button
              variant="secondary"
              onClick={() => {
                setIsModalOpen(false)
                setTakeawayInputs([''])
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveBulk}
              loading={createBulkMutation.isPending}
              disabled={takeawayInputs.every((s) => !s.trim())}
            >
              Save Takeaways
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        open={deleteTarget !== null}
        variant="delete"
        title="Delete Key Takeaway?"
        description={
          <>
            Are you sure you want to delete this takeaway?
            {deleteTarget && (
              <blockquote className="mt-2 p-2.5 bg-surface-container rounded-lg text-[12.5px] italic text-on-surface-variant border-l-2 border-amber-500">
                "{deleteTarget.content}"
              </blockquote>
            )}
          </>
        }
        confirmLabel="Delete"
        loading={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
