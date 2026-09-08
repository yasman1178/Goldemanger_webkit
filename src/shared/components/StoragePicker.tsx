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
  return s.name ?? s.location ?? `مخزن #${s.id}`
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
  triggerClassName?: string
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
  triggerClassName,
}: StoragePickerProps) {
  const [open, setOpen] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState(false)

  const visibleStorages = storages.filter((s) => !excludeIds.includes(s.id))
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

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          'flex h-11 shrink-0 touch-target items-center gap-2 rounded-xl border-2 px-4 text-[13px] font-semibold transition-colors',
          selected
            ? 'border-primary bg-primary/10 text-primary'
            : 'border-dashed border-black/25 bg-white text-muted-foreground hover:border-primary/60 hover:text-primary',
          triggerClassName,
        )}
      >
        <Boxes className="size-4 shrink-0" />
        <span className="min-w-0 truncate">{triggerLabel}</span>
      </button>

      <Dialog open={open} onOpenChange={(o) => !o && setOpen(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[18px]">
              <Boxes className="size-5 text-primary" />
              اختيار المخزن
            </DialogTitle>
            <DialogDescription>
              اعرض قطع مخزن واحد بالضغط على رقمه
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {allowAll && (
              <button
                type="button"
                onClick={() => {
                  onChange('all')
                  setOpen(false)
                }}
                className={cn(
                  'flex h-14 w-full touch-target items-center gap-3 rounded-2xl border-2 px-4 text-start transition-colors',
                  value === 'all'
                    ? 'border-primary bg-primary/10'
                    : 'border-black/10 bg-white hover:border-primary/50',
                )}
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted-foreground/10 text-[13px] font-bold tabular-nums text-foreground">
                  {visibleStorages.length}
                </span>
                <span className="min-w-0">
                  <span className="block text-[14px] font-bold text-foreground">
                    {allLabel}
                  </span>
                  <span className="block text-[11px] text-muted-foreground">
                    عرض كل القطع المتاحة
                  </span>
                </span>
              </button>
            )}

            {visibleStorages.length > 0 && (
              <div className="grid grid-cols-2 gap-2.5">
                {visibleStorages.map((s) => {
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
                        'flex h-16 touch-target items-center gap-3 rounded-2xl border-2 px-3 text-start transition-colors',
                        active
                          ? 'border-primary bg-primary/10'
                          : 'border-black/10 bg-white hover:border-primary/50',
                      )}
                    >
                      <span
                        className={cn(
                          'flex size-9 shrink-0 items-center justify-center rounded-xl text-[13px] font-bold tabular-nums',
                          active
                            ? 'bg-primary text-white'
                            : 'bg-primary/10 text-primary',
                        )}
                      >
                        {s.id}
                      </span>
                      <span className="min-w-0">
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
            )}

            {allowCreate && (
              <div className="border-t border-black/10 pt-3">
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

          <DialogFooter>
            <Button
              type="button"
              onClick={() => setOpen(false)}
              className="h-11 flex-1 rounded-full touch-target"
            >
              إغلاق
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}