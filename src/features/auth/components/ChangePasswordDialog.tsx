import { useState, type FormEvent } from 'react'
import { KeyRound } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@/shared/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import { Input } from '@/shared/components/ui/input'
import { changeMyPassword } from '@/features/auth/api'

export function ChangePasswordDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const queryClient = useQueryClient()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const mutation = useMutation({
    mutationFn: () => changeMyPassword({ currentPassword, newPassword }),
    onSuccess: () => {
      toast.success('تم تغيير كلمة المرور بنجاح')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      onOpenChange(false)
      queryClient.invalidateQueries({ queryKey: ['auth'] })
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err?.response?.data?.message ?? 'تعذّر تغيير كلمة المرور')
    },
  })

  function handleOpenChange(next: boolean) {
    if (!next && !mutation.isPending) {
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    }
    onOpenChange(next)
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (newPassword.length < 6) {
      toast.error('كلمة المرور الجديدة يجب ألا تقل عن 6 أحرف')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('تأكيد كلمة المرور غير مطابق')
      return
    }
    mutation.mutate()
  }

  const disabled =
    mutation.isPending ||
    !currentPassword ||
    !newPassword ||
    !confirmPassword

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>تغيير كلمة المرور</DialogTitle>
          <DialogDescription>
            أدخل كلمة المرور الحالية ثم كلمة المرور الجديدة لحسابك.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="current-password" className="text-[13px] font-semibold leading-[1.35] text-foreground">
              كلمة المرور الحالية
            </label>
            <Input
              id="current-password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="h-11 rounded-[14px] touch-target"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="new-password" className="text-[13px] font-semibold leading-[1.35] text-foreground">
              كلمة المرور الجديدة
            </label>
            <Input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="h-11 rounded-[14px] touch-target"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="confirm-password" className="text-[13px] font-semibold leading-[1.35] text-foreground">
              تأكيد كلمة المرور الجديدة
            </label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="h-11 rounded-[14px] touch-target"
            />
          </div>
          <DialogFooter className="gap-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              className="h-11 rounded-full touch-target"
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              disabled={disabled}
              className="h-11 gap-2 rounded-full touch-target"
            >
              <KeyRound className="size-4" />
              {mutation.isPending ? 'جارٍ الحفظ...' : 'تغيير كلمة المرور'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
