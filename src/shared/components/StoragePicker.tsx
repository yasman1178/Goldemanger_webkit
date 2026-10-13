import { useState } from 'react'
import { Boxes, Loader2, Plus } from 'lucide-react'
import { toast } from 'sonner'

import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'

export type StorageOption = {
  id: number
  name?: string | null
  location?: string | null
  branchId?: number
}

function storageLabel(s: StorageOption): string {
  const text = (s.name && s.name.trim()) || (s.location && s.location.trim())
  return text || `مخزن #${s.id}`
}

interface StoragePickerProps {
  value: string
  storages: StorageOption[]
  onChange: (value: string) => void
  allowAll?: boolean
  allLabel?: string
  placeholder?: string
  excludeIds?: number[]
  allowCreate?: boolean
  onCreateStorage?: (name: string) => Promise<StorageOption>
  variant?: 'primary' | 'violet'
  triggerClassName?: string
}

const triggerVariants = {
  primary: {
    idle: 'border-dashed border-black/25 bg-white text-muted-foreground hover:border-primary/60 hover:text-primary',
    selected: 'border-primary bg-primary/10 text-primary',
  },
  violet: {
    idle: 'border-dashed border-violet-300 bg-violet-50/60 text-violet-700 hover:border-violet-400 hover:bg-violet-100/70 hover:text-violet-800',
    selected: 'border-violet-500 bg-violet-100/80 text-violet-800',
  },
}

export function StoragePicker({
  value,
  storages,
  onChange,
  allowAll = true,
  allLabel = 'كل المخازن',
  placeholder = 'المخزن',
  excludeIds = [],
  allowCreate = false,
  onCreateStorage,
  variant = 'primary',
  triggerClassName,
}: StoragePickerProps) {
  const [open, setOpen] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState(false)
  const [search, setSearch] = useState('')

  const visibleStorages = storages.filter((s) => !excludeIds.includes(s.id))
  const filteredStorages = visibleStorages.filter((s) => {
    if (!search.trim()) return true
    const q = search.trim().toLowerCase()
    const idStr = String(s.id)
    const label = storageLabel(s).toLowerCase()
    return idStr.includes(q) || label.includes(q)
  })

  const selected = storages.find((s) => String(s.id) === value)

  const triggerLabel =
    value === 'all' && allowAll
      ? allLabel
      : selected
        ? storageLabel(selected)
        : placeholder

  async function handleCreate() {
    const name = newName.trim()
    if (!name) {
      toast.error('اكتب اسم المخزن الجديد.')
      return
    }
    if (!onCreateStorage) return
    try {
      setCreating(true)
      const created = await onCreateStorage(name)
      onChange(String(created.id))
      setOpen(false)
      setNewName('')
      setShowCreate(false)
    } catch {
      toast.error('فشل إنشاء المخزن.')
    } finally {
      setCreating(false)
    }
  }

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setSearch('')
      setShowCreate(false)
    }
    setOpen(nextOpen)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          'flex h-11 shrink-0 touch-target items-center gap-2 rounded-xl border-2 px-4 text-[13px] font-semibold transition-colors',
          selected
            ? triggerVariants[variant].selected
            : triggerVariants[variant].idle,
          triggerClassName,
        )}
      >
        <Boxes className="size-4 shrink-0" />
        <span className="min-w-0 truncate">{triggerLabel}</span>
      </button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="w-[calc(100vw-1.5rem)] max-w-md max-h-[85dvh] flex flex-col p-0 overflow-hidden rounded-[20px] gap-0 sm:max-w-md">
          <DialogHeader className="p-3.5 sm:p-5 border-b border-black/5 bg-secondary/30 shrink-0 space-y-2">
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2 text-[16px] sm:text-[17px] font-bold">
                <Boxes className="size-5 text-primary" />
                اختيار المخزن
              </DialogTitle>
              <span className="text-[11px] font-bold text-muted-foreground bg-black/5 px-2.5 py-0.5 rounded-full tabular-nums">
                {visibleStorages.length} مخزن
              </span>
            </div>
            <DialogDescription className="text-[12px] text-muted-foreground">
              اختر مخزناً واحداً لعرض قطعه، أو اختر «كل المخازن»
            </DialogDescription>

            {visibleStorages.length > 2 && (
              <div className="relative pt-1">
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="ابحث برقم أو اسم المخزن..."
                  className="h-10 text-[13px] rounded-xl pr-3.5 pl-8 bg-white border-black/10 focus-visible:ring-primary touch-target"
                />
                {search ? (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    aria-label="مسح البحث"
                    className="absolute left-2.5 top-[calc(50%+2px)] -translate-y-1/2 text-muted-foreground hover:text-foreground text-[12px] p-1.5"
                  >
                    ✕
                  </button>
                ) : null}
              </div>
            )}
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-3.5 sm:p-5 space-y-2.5 min-h-0">
            {allowAll && (!search.trim() || 'كل المخازن'.includes(search.trim())) && (
              <button
                type="button"
                onClick={() => {
                  onChange('all')
                  setOpen(false)
                }}
                className={cn(
                  'flex h-13 sm:h-14 w-full touch-target items-center gap-3 rounded-2xl border-2 px-3.5 sm:px-4 text-start transition-colors',
                  value === 'all'
                    ? 'border-primary bg-primary/10'
                    : 'border-black/10 bg-white hover:border-primary/50',
                )}
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted-foreground/10 text-[13px] font-bold tabular-nums text-foreground">
                  {visibleStorages.length}
                </span>
                <span className="min-w-0">
                  <span className="block text-[13.5px] sm:text-[14px] font-bold text-foreground">
                    {allLabel}
                  </span>
                  <span className="block text-[11px] text-muted-foreground">
                    عرض كل القطع المتاحة
                  </span>
                </span>
              </button>
            )}

            {filteredStorages.length > 0 ? (
              <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 gap-2 sm:gap-2.5">
                {filteredStorages.map((s) => {
                  const active = value === String(s.id)
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        onChange(String(s.id))
                        setOpen(false)
                      }}
                      className={cn(
                        'flex min-h-[54px] sm:h-15 touch-target items-center gap-2.5 rounded-2xl border-2 px-3 py-2 text-start transition-colors',
                        active
                          ? 'border-primary bg-primary/10'
                          : 'border-black/10 bg-white hover:border-primary/50',
                      )}
                    >
                      <span
                        className={cn(
                          'flex size-9 shrink-0 items-center justify-center rounded-xl text-[13px] font-bold tabular-nums',
                          active
                            ? 'bg-primary text-white shadow-sm'
                            : 'bg-primary/10 text-primary',
                        )}
                      >
                        {s.id}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-bold text-foreground">
                          {storageLabel(s)}
                        </span>
                        <span className="block text-[10px] tabular-nums text-muted-foreground">
                          مخزن #{s.id}
                        </span>
                      </span>
                    </button>
                  )
                })}
              </div>
            ) : (
              <p className="py-6 text-center text-[13px] text-muted-foreground">
                {search.trim()
                  ? `لا توجد نتائج مطابقة لـ "${search}"`
                  : 'لا توجد مخازن حالياً، يمكنك إنشاء مخزن جديد بالأسفل.'}
              </p>
            )}

            {allowCreate && (
              <div className="border-t border-black/10 pt-3 mt-2">
                {!showCreate ? (
                  <button
                    type="button"
                    onClick={() => setShowCreate(true)}
                    className="flex h-12 w-full touch-target items-center justify-center gap-2 rounded-2xl border border-dashed border-primary/40 bg-primary/5 text-[14px] font-semibold text-primary transition-colors hover:bg-primary/10"
                  >
                    <Plus className="size-4" />
                    إضافة مخزن جديد
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <Input
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleCreate()
                        }
                      }}
                      placeholder="اسم المخزن الجديد"
                      autoFocus
                      className="h-12 touch-target rounded-[14px]"
                    />
                    <Button
                      type="button"
                      onClick={handleCreate}
                      disabled={creating}
                      className="h-12 shrink-0 rounded-[14px] px-4 touch-target"
                    >
                      {creating && <Loader2 className="size-4 animate-spin" />}
                      إنشاء
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="p-3 border-t border-black/5 bg-secondary/30 shrink-0">
            <Button
              type="button"
              onClick={() => setOpen(false)}
              className="h-11 w-full rounded-full touch-target"
            >
              إغلاق
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}