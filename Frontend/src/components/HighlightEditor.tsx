import { useState } from 'react'
import { Plus, X } from 'lucide-react'

export interface HighlightEditorItem {
  localId: string
  existingId?: string
  text: string
}

type HighlightStatus = 'GOOD' | 'BAD'

interface HighlightEditorProps {
  good: HighlightEditorItem[]
  bad: HighlightEditorItem[]
  onChange: (status: HighlightStatus, items: HighlightEditorItem[]) => void
}

const TABS: { key: HighlightStatus; label: string; activeClassName: string }[] = [
  { key: 'GOOD', label: 'Good highlights', activeClassName: 'bg-tertiary text-on-tertiary' },
  { key: 'BAD', label: 'Bad highlights', activeClassName: 'bg-error text-on-error' },
]

export function HighlightEditor({ good, bad, onChange }: HighlightEditorProps) {
  const [tab, setTab] = useState<HighlightStatus>('GOOD')
  const items = tab === 'GOOD' ? good : bad
  const setItems = (next: HighlightEditorItem[]) => onChange(tab, next)

  const addItem = () => {
    setItems([...items, { localId: crypto.randomUUID(), text: '' }])
  }

  const updateItem = (localId: string, text: string) => {
    setItems(items.map(it => (it.localId === localId ? { ...it, text } : it)))
  }

  const removeItem = (localId: string) => {
    setItems(items.filter(it => it.localId !== localId))
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="text-[12px] font-semibold uppercase tracking-wider text-on-surface-variant/70">
        Highlights
      </label>

      <div className="flex items-center gap-1 bg-surface-container rounded-lg p-1 w-fit">
        {TABS.map(t => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`px-3 py-1.5 rounded-md text-[12px] font-semibold transition-colors duration-200 ${
              tab === t.key ? t.activeClassName : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        {items.map(item => (
          <div key={item.localId} className="flex items-start gap-2">
            <textarea
              value={item.text}
              onChange={e => updateItem(item.localId, e.target.value)}
              rows={2}
              placeholder={`Add a ${tab === 'GOOD' ? 'good' : 'bad'} highlight for this week`}
              className={`flex-1 px-3 py-2.5 rounded-lg border text-[14px] text-on-surface bg-white focus:outline-none focus:ring-2 transition-colors duration-200 resize-y ${
                tab === 'GOOD'
                  ? 'border-outline-variant focus:border-tertiary focus:ring-tertiary/20'
                  : 'border-outline-variant focus:border-error focus:ring-error/20'
              }`}
            />
            <button
              type="button"
              onClick={() => removeItem(item.localId)}
              title="Remove highlight"
              className="mt-2 shrink-0 text-on-surface-variant/50 hover:text-error transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={addItem}
          className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-dashed text-[12px] font-semibold transition-colors duration-200 self-start text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
        >
          <Plus className="w-3.5 h-3.5" />
          Add another {tab === 'GOOD' ? 'good' : 'bad'} highlight
        </button>
      </div>
    </div>
  )
}