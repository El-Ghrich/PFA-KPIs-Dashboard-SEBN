import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { usersApi } from '../api/users'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorState } from '../components/ui/ErrorState'
import { useToast } from '../contexts/ToastContext'
import { Modal } from '../components/ui/Modal'
import { ConfirmModal } from '../components/ui/ConfirmModal'
import { Pencil, Trash2, UserPlus } from 'lucide-react'
import type { User } from '../types'

const ROLE_LABEL: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
}

const ROLE_BADGE: Record<string, string> = {
  SUPER_ADMIN: 'bg-primary/10 text-primary',
  ADMIN: 'bg-alert/10 text-alert',
}

export default function UserManagement() {
  const queryClient = useQueryClient()
  const { showSuccess, showError } = useToast()

  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [password, setPassword] = useState('')
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [editFullName, setEditFullName] = useState('')
  const [editPassword, setEditPassword] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null)

  const usersQuery = useQuery({ queryKey: ['users'], queryFn: () => usersApi.list() })
  const users = usersQuery.data ?? []

  const createMutation = useMutation({
    mutationFn: () => usersApi.create({ email: email.trim(), full_name: fullName.trim(), password, role: 'ADMIN' }),
    onSuccess: async () => {
      showSuccess(`Admin user "${fullName}" created successfully!`)
      setEmail('')
      setFullName('')
      setPassword('')
      await queryClient.invalidateQueries({ queryKey: ['users'] })
    },
    onError: (err) => showError(err, 'Failed to Create Admin'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => usersApi.remove(id),
    onSuccess: () => {
      showSuccess('Admin account removed.')
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setDeleteTarget(null)
    },
    onError: (err) => showError(err, 'Failed to Delete User'),
  })

  const editMutation = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Parameters<typeof usersApi.update>[1] }) =>
      usersApi.update(id, patch),
    onSuccess: () => {
      showSuccess('Admin account updated successfully!')
      setEditingUser(null)
      setEditFullName('')
      setEditPassword('')
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
    onError: (err) => showError(err, 'Failed to Update User'),
  })

  const openEditModal = (user: User) => {
    setEditingUser(user)
    setEditFullName(user.full_name)
    setEditPassword('')
  }

  const handleEditSubmit = () => {
    if (!editingUser) return
    const patch: Parameters<typeof usersApi.update>[1] = {}
    if (editFullName.trim() && editFullName.trim() !== editingUser.full_name) {
      patch.full_name = editFullName.trim()
    }
    if (editPassword) {
      patch.password = editPassword
    }
    if (Object.keys(patch).length === 0) {
      setEditingUser(null)
      return
    }
    editMutation.mutate({ id: editingUser.id, patch })
  }

  const emailError = email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? 'Enter a valid email address' : undefined

  return (
    <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-surface">
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="max-w-[1440px] mx-auto w-full px-4 sm:px-8 py-6 sm:py-8">

          <header className="mb-6">
            <h1 className="text-xl sm:text-2xl font-semibold text-on-surface">Admin User Management</h1>
            <p className="text-sm text-on-surface-variant mt-1">
              Create and manage platform admin accounts.
            </p>
          </header>

          {/* ── Add admin card ─────────────────────────────── */}
          <Card className="mb-6">
            <h2 className="text-[15px] font-semibold text-on-surface mb-4 flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-primary" />
              Add New Admin
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input label="Full Name" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="e.g. John Doe" />
              <Input label="Email Address" type="email" value={email} error={emailError} onChange={e => setEmail(e.target.value)} placeholder="john@company.com" />
              <Input label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
            </div>
            <div className="flex items-center gap-3 mt-4 flex-wrap">
              <Button
                onClick={() => createMutation.mutate()}
                loading={createMutation.isPending}
                disabled={!fullName.trim() || !email.trim() || !password || !!emailError}
              >
                Add Admin
              </Button>
            </div>
          </Card>

          {/* ── Users list ───────────────────────────────── */}
          {usersQuery.isError ? (
            <ErrorState error={usersQuery.error} onRetry={usersQuery.refetch} />
          ) : usersQuery.isLoading ? (
            <EmptyState className="h-48" message="Loading admin accounts..." />
          ) : users.length === 0 ? (
            <EmptyState className="h-48" message="No user accounts found" />
          ) : (
            <Card>
              <h2 className="text-[15px] font-semibold text-on-surface mb-4">Accounts ({users.length})</h2>
              <div className="flex flex-col divide-y divide-border-card">
                {users.map(user => (
                  <div key={user.id} className="py-3 flex items-center gap-3 justify-between">
                    {/* Avatar + Info */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold shrink-0">
                        {user.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-[14px] font-medium text-on-surface truncate">{user.full_name}</p>
                          <span className={`shrink-0 text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-full ${ROLE_BADGE[user.role]}`}>
                            {ROLE_LABEL[user.role]}
                          </span>
                        </div>
                        <p className="text-[12px] text-on-surface-variant/70 truncate">
                          {user.email} &middot; Joined {new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    {user.role !== 'SUPER_ADMIN' && (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => openEditModal(user)}
                          title="Edit admin"
                          className="p-2 text-on-surface-variant/50 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(user)}
                          title="Delete admin"
                          className="p-2 text-on-surface-variant/50 hover:text-error hover:bg-error/5 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* ── Edit user modal ─────────────────────────────── */}
      <Modal
        open={editingUser !== null}
        title="Edit Admin Account"
        onClose={() => {
          setEditingUser(null)
          setEditPassword('')
        }}
      >
        <div className="space-y-4">
          <Input label="Full Name" value={editFullName} onChange={e => setEditFullName(e.target.value)} />
          <Input
            label="New Password"
            type="password"
            value={editPassword}
            placeholder="Leave blank to keep current password"
            onChange={e => setEditPassword(e.target.value)}
          />
          {editingUser && (
            <p className="text-[12px] text-on-surface-variant/70">
              {editingUser.email} &middot; {ROLE_LABEL[editingUser.role]}
            </p>
          )}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              variant="secondary"
              onClick={() => {
                setEditingUser(null)
                setEditPassword('')
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditSubmit}
              loading={editMutation.isPending}
              disabled={!editFullName.trim() || (!editPassword && editFullName.trim() === editingUser?.full_name)}
            >
              Save Changes
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Delete user confirmation modal ──────────────── */}
      <ConfirmModal
        open={deleteTarget !== null}
        variant="delete"
        title={`Delete "${deleteTarget?.full_name}"?`}
        description={
          <>
            This will permanently delete admin account <strong>{deleteTarget?.email}</strong>. This action cannot be undone.
          </>
        }
        confirmLabel="Delete admin"
        loading={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
      />
    </main>
  )
}
