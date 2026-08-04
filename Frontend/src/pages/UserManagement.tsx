import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { usersApi } from '../api/users'
import { useAuth } from '../contexts/AuthContext'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { Dropdown } from '../components/ui/Dropdown'
import { EmptyState } from '../components/ui/EmptyState'
import { Modal } from '../components/ui/Modal'
import { Pencil, Trash2 } from 'lucide-react'
import type { User } from '../types'

type ManageableRole = 'ADMIN' | 'VIEWER'

const ROLE_LABEL: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
  VIEWER: 'Viewer',
}

const ASSIGNABLE_ROLES: { value: ManageableRole; label: string }[] = [
  { value: 'VIEWER', label: 'Viewer' },
  { value: 'ADMIN', label: 'Admin' },
]

export default function UserManagement() {
  const { user: currentUser } = useAuth()
  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN'
  const queryClient = useQueryClient()
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<ManageableRole>('VIEWER')
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [editFullName, setEditFullName] = useState('')
  const [editPassword, setEditPassword] = useState('')

  const usersQuery = useQuery({ queryKey: ['users'], queryFn: () => usersApi.list() })
  const users = usersQuery.data ?? []

  const createMutation = useMutation({
    mutationFn: () => usersApi.create({ email, full_name: fullName, password, role }),
    onSuccess: async () => {
      setEmail('')
      setFullName('')
      setPassword('')
      setRole('VIEWER')
      await queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })

  const roleMutation = useMutation({
    mutationFn: ({ id, nextRole }: { id: string; nextRole: ManageableRole }) =>
      usersApi.update(id, { role: nextRole }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => usersApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  })

  const editMutation = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Parameters<typeof usersApi.update>[1] }) =>
      usersApi.update(id, patch),
    onSuccess: () => {
      setEditingUser(null)
      setEditFullName('')
      setEditPassword('')
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })

  const handleDelete = (user: User) => {
    if (window.confirm(`Delete user "${user.full_name}" (${user.email})? This cannot be undone.`)) {
      deleteMutation.mutate(user.id)
    }
  }

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

  const canChangeRole = (user: User) => isSuperAdmin && user.role !== 'SUPER_ADMIN'

  const emailError = email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? 'Enter a valid email address' : undefined

  return (
    <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-surface">
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="max-w-[1440px] mx-auto w-full px-8 py-8">
          <header className="mb-6">
            <h1 className="text-2xl font-semibold text-on-surface">User Management</h1>
            <p className="text-sm text-on-surface-variant mt-1">
              {isSuperAdmin ? 'Manage all accounts, including admins.' : 'Manage viewer accounts.'}
            </p>
          </header>

          <Card className="mb-6">
            <h2 className="text-[15px] font-semibold text-on-surface mb-4">Add user</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Input label="Full name" value={fullName} onChange={e => setFullName(e.target.value)} />
              <Input label="Email" type="email" value={email} error={emailError} onChange={e => setEmail(e.target.value)} />
              <Input label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
              {isSuperAdmin ? (
                <Dropdown<ManageableRole> label="Role" value={role} options={ASSIGNABLE_ROLES} onChange={setRole} />
              ) : (
                <Input label="Role" value="Viewer" disabled />
              )}
            </div>
            <div className="flex items-center gap-3 mt-4">
              <Button
                onClick={() => createMutation.mutate()}
                loading={createMutation.isPending}
                disabled={!fullName.trim() || !email.trim() || !password || !!emailError}
              >
                Add user
              </Button>
              {createMutation.isError && (
                <p className="text-[13px] text-error font-medium">Could not create user. Email may already be in use.</p>
              )}
            </div>
          </Card>

          {usersQuery.isLoading ? (
            <EmptyState className="h-48" message="Loading users..." />
          ) : users.length === 0 ? (
            <EmptyState className="h-48" message="No users yet" />
          ) : (
            <Card>
              <h2 className="text-[15px] font-semibold text-on-surface mb-4">Users ({users.length})</h2>
              <div className="flex flex-col divide-y divide-border-card">
                {users.map(user => (
                  <div key={user.id} className="flex items-center gap-4 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-medium text-on-surface truncate">{user.full_name}</p>
                      <p className="text-[12px] text-on-surface-variant/70 truncate">{user.email}</p>
                    </div>
                    {canChangeRole(user) ? (
                      <Dropdown<ManageableRole>
                        label="Role"
                        value={user.role as ManageableRole}
                        options={ASSIGNABLE_ROLES}
                        onChange={nextRole => roleMutation.mutate({ id: user.id, nextRole })}
                        className="w-[130px]"
                      />
                    ) : (
                      <span className="w-[130px] text-[12px] font-medium text-on-surface-variant capitalize">
                        {ROLE_LABEL[user.role]}
                      </span>
                    )}
                    <span className="hidden md:block text-[12px] text-on-surface-variant/60 w-24 text-right">
                      {new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                    {user.role !== 'SUPER_ADMIN' && (
                      <>
                        <button
                          onClick={() => openEditModal(user)}
                          title="Edit user"
                          className="p-2 text-on-surface-variant/50 hover:text-primary transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(user)}
                          title="Delete user"
                          className="p-2 text-on-surface-variant/50 hover:text-error transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>

      <Modal
        open={editingUser !== null}
        title="Edit user"
        onClose={() => {
          setEditingUser(null)
          setEditPassword('')
        }}
      >
        <div className="space-y-4">
          <Input label="Full name" value={editFullName} onChange={e => setEditFullName(e.target.value)} />
          <Input
            label="New password"
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
          {editMutation.isError && (
            <p className="text-[13px] text-error font-medium">Could not save changes. Email may be invalid or in use.</p>
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
              Save
            </Button>
          </div>
        </div>
      </Modal>
    </main>
  )
}
