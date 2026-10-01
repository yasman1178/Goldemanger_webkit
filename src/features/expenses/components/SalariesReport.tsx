import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Printer, Wallet, Users, Banknote, UserCheck } from 'lucide-react'

import { getSalaries } from '@/features/expenses/api'
import {
  periodPresets,
  resolvePeriod,
  toDateInputValue,
  type PeriodPreset,
} from '@/shared/lib/period'
import { useActiveBranchId } from '@/shared/hooks/useActiveBranchId'
import { formatEgp, formatNumber, cn } from '@/shared/lib/utils'
import { Card } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Skeleton } from '@/shared/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table'

function formatDay(value: string): string {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return new Intl.DateTimeFormat('ar-EG', {
    dateStyle: 'medium',
  }).format(d)
}

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = 'default',
}: {
  label: string
  value: string
  hint?: string
  icon?: typeof Wallet
  tone?: 'default' | 'accent' | 'warning'
}) {
  return (
    <Card
      className={cn(
        'rounded-[14px] border border-black/5 bg-white p-3.5 shadow-xs elevation-card transition-all',
        tone === 'accent' && 'border-amber-400/40 bg-gradient-to-br from-white to-amber-50/40',
      )}
    >
      <div className="flex items-center justify-between text-muted-foreground">
        <span className="text-[12px] font-semibold">{label}</span>
        {Icon && (
          <span
            className={cn(
              'flex size-7 items-center justify-center rounded-lg',
              tone === 'accent'
                ? 'bg-amber-100/70 text-amber-700'
                : 'bg-secondary text-muted-foreground',
            )}
          >
            <Icon className="size-3.5" />
          </span>
        )}
      </div>
      <div className="mt-2">
        <p
          className={cn(
            'text-[20px] sm:text-[22px] font-black tabular-nums',
            tone === 'accent' ? 'text-amber-700 dark:text-amber-400' : 'text-foreground',
          )}
        >
          {value}
        </p>
        {hint && <p className="mt-0.5 text-[11px] text-muted-foreground">{hint}</p>}
      </div>
    </Card>
  )
}

/** كشف أجور الفترة — يعتمد على Expense بتصنيف "راتب" مربوطاً بموظف. */
export function SalariesReport() {
  const activeBranchId = useActiveBranchId()
  const hasValidBranch = activeBranchId != null

  const [preset, setPreset] = useState<PeriodPreset>('thisMonth')
  const [customRange, setCustomRange] = useState(() => {
    const { startDate, endDate } = resolvePeriod('thisMonth')
    return { startDate, endDate }
  })

  const range = useMemo(
    () => (preset === 'custom' ? customRange : resolvePeriod(preset)),
    [preset, customRange],
  )

  const rangeIsValid = range.startDate <= range.endDate

  const { data, isLoading, isError } = useQuery({
    queryKey: ['salaries', activeBranchId, range.startDate, range.endDate],
    queryFn: () =>
      getSalaries({
        startDate: range.startDate,
        endDate: range.endDate,
        branchId: activeBranchId ?? undefined,
      }),
    enabled: hasValidBranch && rangeIsValid,
    retry: false,
  })

  const employees = data?.employees ?? []

  return (
    <div className="space-y-4">
      {/* ─── شريط الفلترة واختيار الفترة المدمج ─── */}
      <Card className="receipt-no-print rounded-[14px] border border-black/5 bg-white p-3.5 shadow-xs elevation-card">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-bold text-muted-foreground me-1 hidden sm:inline">
              الفترة:
            </span>
            <div className="inline-flex flex-wrap rounded-[10px] bg-secondary p-0.5 border border-black/5">
              {periodPresets.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setPreset(option.value)}
                  className={cn(
                    'h-8 px-3 rounded-[8px] text-xs font-bold transition-all cursor-pointer touch-target',
                    preset === option.value
                      ? 'bg-white text-primary shadow-xs'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between md:justify-end gap-2">
            {data && (
              <span className="text-[11px] text-muted-foreground tabular-nums">
                من {formatDay(data.startDate)} إلى {formatDay(data.endDate)}
              </span>
            )}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => window.print()}
              className="receipt-no-print h-8 shrink-0 gap-1.5 rounded-[9px] text-xs font-bold touch-target cursor-pointer"
            >
              <Printer className="size-3.5" />
              طباعة الكشف
            </Button>
          </div>
        </div>

        {preset === 'custom' && (
          <div className="mt-3 pt-3 border-t border-black/5 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label htmlFor="salary-from-date" className="text-xs font-semibold text-muted-foreground">
                من:
              </label>
              <Input
                id="salary-from-date"
                type="date"
                value={customRange.startDate}
                max={toDateInputValue(new Date())}
                onChange={(e) =>
                  setCustomRange((r) => ({ ...r, startDate: e.target.value }))
                }
                className="h-9 w-40 rounded-[9px] text-xs tabular-nums"
              />
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="salary-to-date" className="text-xs font-semibold text-muted-foreground">
                إلى:
              </label>
              <Input
                id="salary-to-date"
                type="date"
                value={customRange.endDate}
                max={toDateInputValue(new Date())}
                onChange={(e) =>
                  setCustomRange((r) => ({ ...r, endDate: e.target.value }))
                }
                className="h-9 w-40 rounded-[9px] text-xs tabular-nums"
              />
            </div>

            {!rangeIsValid && (
              <p className="text-xs font-bold text-error">
                تاريخ البدء لا يمكن أن يكون بعد تاريخ الانتهاء.
              </p>
            )}
          </div>
        )}
      </Card>

      {!hasValidBranch ? (
        <div className="py-12 text-center text-sm text-muted-foreground">
          لا يوجد فرع نشط محدد. يرجى اختيار فرع من أعلى الصفحة لعرض كشف أجوره.
        </div>
      ) : isLoading ? (
        <div className="space-y-3">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            <Skeleton className="h-20 rounded-[14px]" />
            <Skeleton className="h-20 rounded-[14px]" />
            <Skeleton className="h-20 rounded-[14px]" />
          </div>
          <Skeleton className="h-64 rounded-[14px]" />
        </div>
      ) : isError ? (
        <div className="py-12 text-center text-sm font-semibold text-error">
          تعذّر تحميل كشف الأجور. تأكد من اتصال الإنترنت ثم أعد المحاولة.
        </div>
      ) : (
        <>
          {/* كروت الإحصائيات لكشف الرواتب */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <StatCard
              label="إجمالي أجور الفترة"
              value={formatEgp(data?.totalAmount ?? 0)}
              icon={Wallet}
              tone="accent"
              hint="مجموع الرواتب والسلف المصروفة"
            />
            <StatCard
              label="عدد الموظفين المستلمين"
              value={`${formatNumber(data?.employeesCount ?? 0)} موظف`}
              icon={Users}
              hint="موظف مسجّل له صرفة خلال الفترة"
            />
            <StatCard
              label="عدد عمليات الصرف"
              value={`${formatNumber(data?.paymentsCount ?? 0)} عملية`}
              icon={Banknote}
              hint="سندات صرف رواتب"
            />
          </div>

          {/* جدول توزيع الأجور على الموظفين */}
          <Card className="rounded-[14px] border border-black/5 bg-white overflow-hidden shadow-xs elevation-card">
            <div className="p-4 pb-2 border-b border-black/5 flex items-center justify-between">
              <h3 className="text-sm font-bold text-foreground">
                توزيع رواتب الموظفين خلال الفترة
              </h3>
              <span className="text-xs font-semibold text-muted-foreground tabular-nums">
                {employees.length} موظف
              </span>
            </div>

            {employees.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-secondary/60">
                    <TableRow className="border-b border-black/5">
                      <TableHead className="text-xs font-bold text-muted-foreground">
                        اسم الموظف
                      </TableHead>
                      <TableHead className="text-xs font-bold text-muted-foreground w-28 text-center">
                        عدد الصرفات
                      </TableHead>
                      <TableHead className="text-xs font-bold text-muted-foreground w-40 text-start">
                        إجمالي المستلم
                      </TableHead>
                      <TableHead className="text-xs font-bold text-muted-foreground w-44">
                        النسبة من الإجمالي
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-black/5">
                    {employees.map((employee) => {
                      const totalPayroll = data?.totalAmount ?? 0
                      const share =
                        totalPayroll > 0
                          ? (employee.totalAmount / totalPayroll) * 100
                          : 0

                      return (
                        <TableRow
                          key={employee.employeeId ?? employee.employeeName}
                          className="hover:bg-slate-50/70 transition-colors"
                        >
                          <TableCell className="text-xs font-bold text-foreground whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs">
                                {employee.employeeName.charAt(0)}
                              </span>
                              <span>{employee.employeeName}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs tabular-nums text-center text-muted-foreground font-semibold">
                            {formatNumber(employee.paymentsCount)}
                          </TableCell>
                          <TableCell className="text-start">
                            <span className="text-xs font-black tabular-nums text-foreground">
                              {formatEgp(employee.totalAmount)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 rounded-full bg-secondary overflow-hidden">
                                <div
                                  className="h-full bg-primary rounded-full transition-all"
                                  style={{ width: `${Math.min(100, Math.max(2, share))}%` }}
                                />
                              </div>
                              <span className="text-[11px] font-bold tabular-nums text-muted-foreground w-9 text-end">
                                {share.toFixed(1)}%
                              </span>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-2.5 py-14 text-center">
                <UserCheck className="size-10 text-muted-foreground/60" />
                <p className="text-sm font-bold text-foreground">
                  لا توجد صرفات رواتب في هذه الفترة
                </p>
                <p className="text-xs text-muted-foreground max-w-xs">
                  سجّل أي مصروف بتصنيف «راتب» ومربوط بموظف من تبويب المصروفات اليومية ليظهر في هذا الكشف تلقائياً.
                </p>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  )
}
