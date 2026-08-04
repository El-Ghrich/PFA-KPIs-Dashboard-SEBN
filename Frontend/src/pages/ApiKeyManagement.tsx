import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiKeysApi } from '../api/apiKeys'
import { usersApi } from '../api/users'
import { useAuth } from '../contexts/AuthContext'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { Dropdown } from '../components/ui/Dropdown'
import { EmptyState } from '../components/ui/EmptyState'
import { Copy, Ban, Trash2 } from 'lucide-react'
import type { ApiKey, ApiKeyCreated } from '../types'

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: 'Active',
  REVOKED: 'Revoked',
  DELETED: 'Deleted',
}

const STATUS_STYLE: Record<string, string> = {
  ACTIVE: 'bg-tertiary/15 text-tertiary',
  REVOKED: 'bg-surface-container text-on-surface-variant',
  DELETED: 'bg-error/10 text-error',
}

function defaultExpiry(): string {
  const d = new Date()
  d.setDate(d.getDate() + 90)
  d.setHours(0, 0, 0, 0)
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 16)
}

export default function ApiKeyManagement() {
  const { user: currentUser } = useAuth()
  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN'
  const queryClient = useQueryClient()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [expiresAt, setExpiresAt] = useState(defaultExpiry)
  const [ownerId, setOwnerId] = useState('')
  const [created, setCreated] = useState<ApiKeyCreated | null>(null)
  const [copied, setCopied] = useState(false)
  const [showInactive, setShowInactive] = useState(false)

  const keysQuery = useQuery({ queryKey: ['api-keys'], queryFn: () => apiKeysApi.list() })
  const keys = keysQuery.data ?? []

  const usersQuery = useQuery({ queryKey: ['users'], queryFn: () => usersApi.list() })
  const users = usersQuery.data ?? []

  const userById = new Map(users.map(u => [u.id, u]))

  const createMutation = useMutation({
    mutationFn: () =>
      apiKeysApi.create({
        name,
        description: description || null,
        expires_at: new Date(expiresAt).toISOString(),
        user_id: ownerId || null,
      }),
    onSuccess: (key) => {
      setCreated(key)
      setName('')
      setDescription('')
      setExpiresAt(defaultExpiry)
      setOwnerId('')
      queryClient.invalidateQueries({ queryKey: ['api-keys'] })
    },
  })

  const revokeMutation = useMutation({
    mutationFn: (id: string) => apiKeysApi.revoke(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['api-keys'] }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiKeysApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['api-keys'] }),
  })

  const handleDelete = (key: ApiKey) => {
    if (window.confirm(`Delete API key "${key.name}"? This is a soft delete — the key is kept but disabled.`)) {
      deleteMutation.mutate(key.id)
    }
  }

  const visibleKeys = showInactive ? keys : keys.filter(k => k.status === 'ACTIVE')

  const copyPlainKey = async () => {
    if (!created) return
    await navigator.clipboard.writeText(created.plain_key)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const ownerOptions = [
    { value: '', label: 'Myself' },
    ...users.map(u => ({ value: u.id, label: `${u.full_name} · ${u.email}` })),
  ]

  return (
    <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-surface">
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="max-w-[1440px] mx-auto w-full px-8 py-8">
          <header className="mb-6">
            <h1 className="text-2xl font-semibold text-on-surface">API Key Management</h1>
            <p className="text-sm text-on-surface-variant mt-1">
              Issue keys for programmatic access to the platform.
            </p>
          </header>

          <Card className="mb-6">
            <h2 className="text-[15px] font-semibold text-on-surface mb-4">Create API key</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Input label="Name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Line 1 exporter" />
              <Input label="Description" value={description} onChange={e => setDescription(e.target.value)} placeholder="What this key is used for" />
              <Input label="Expires" type="datetime-local" value={expiresAt} onChange={e => setExpiresAt(e.target.value)} />
              <Dropdown<string> label="Owner" value={ownerId} options={ownerOptions} onChange={setOwnerId} />
            </div>
            <div className="flex items-center gap-3 mt-4">
              <Button
                onClick={() => createMutation.mutate()}
                loading={createMutation.isPending}
                disabled={!name.trim() || !expiresAt}
              >
                Generate key
              </Button>
              {createMutation.isError && (
                <p className="text-[13px] text-error font-medium">Could not create the API key.</p>
              )}
            </div>

            {created && (
              <div className="mt-4 p-4 rounded-lg bg-primary-container/60 border border-primary-fixed-dim">
                <p className="text-[12px] font-semibold uppercase tracking-wide text-on-primary-container mb-1">
                  Copy your key now — it will not be shown again
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-[13px] text-on-primary-container break-all select-all">{created.plain_key}</code>
                  <button onClick={copyPlainKey} title="Copy key" className="p-2 text-on-primary-container hover:bg-primary-container rounded-lg transition-colors">
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-[12px] text-on-primary-container/70 mt-1">
                  {copied ? 'Copied to clipboard.' : `Prefix ${created.key_prefix}… · expires ${new Date(created.expires_at).toLocaleDateString()}`}
                </p>
              </div>
            )}
          </Card>

          {keysQuery.isLoading ? (
            <EmptyState className="h-48" message="Loading API keys..." />
          ) : visibleKeys.length === 0 ? (
            <EmptyState className="h-48" message={showInactive ? 'No API keys in this view' : 'No active API keys yet'} />
          ) : (
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[15px] font-semibold text-on-surface">Keys ({visibleKeys.length})</h2>
                <Button variant="secondary" onClick={() => setShowInactive(v => !v)}>
                  {showInactive ? 'Show active only' : isSuperAdmin ? 'Show revoked & deleted' : 'Show revoked'}
                </Button>
              </div>
              <div className="flex flex-col divide-y divide-border-card">
                {visibleKeys.map(key => {
                  const owner = key.user_id ? userById.get(key.user_id) : null
                  return (
                    <div key={key.id} className="flex items-center gap-4 py-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-[14px] font-medium text-on-surface truncate">{key.name}</p>
                          <span className={`shrink-0 text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-full ${STATUS_STYLE[key.status]}`}>
                            {STATUS_LABEL[key.status]}
                          </span>
                        </div>
                        <p className="text-[12px] text-on-surface-variant/70 truncate">
                          {key.key_prefix}… · {owner ? `${owner.full_name} (${owner.email})` : 'Unknown owner'}
                          {key.description ? ` · ${key.description}` : ''}
                        </p>
                      </div>
                      <span className="hidden md:block text-[12px] text-on-surface-variant/60 w-24 text-right">
                        {new Date(key.expires_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      {key.status === 'ACTIVE' && (
                        <button
                          onClick={() => revokeMutation.mutate(key.id)}
                          title="Revoke key"
                          className="p-2 text-on-surface-variant/50 hover:text-error transition-colors"
                        >
                          <Ban className="w-4 h-4" />
                        </button>
                      )}
                      {key.status !== 'DELETED' && (
                        <button
                          onClick={() => handleDelete(key)}
                          title="Delete key"
                          className="p-2 text-on-surface-variant/50 hover:text-error transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </Card>
          )}
        </div>
      </div>
    </main>
  )
}
