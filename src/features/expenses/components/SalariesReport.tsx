import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Printer, Wallet } from 'lucide-react'

import { getSalaries } from '@/features/expenses/api'
import {
  periodPresets,
  resolvePeriod,
  toDateInputValue,
  type PeriodPreset,
} from '@/shared/lib/period'
import { useActiveBranchId } from '@/shared/hooks/useActiveBranchId'
import { formatEgp, formatNumber, cn } from '@/shared/lib/utils'
import { Card, CardContent } from '@/shared/components/ui/card'
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
    dateStyle: 'long',
  }).format(d)
}

function StatCard({
  label,
  value,
  hint,
  tone = 'default',
}: {
  label: string
  value: string
  hint?: string
  tone?: 'default' | 'accent'
}) {
  return (
    <Card
      className={cn(
        'rounded-[14px] elevation-card',
        tone === 'accent' && 'border-primary/20 bg-primary/[0.04]',
      )}
    >
      <CardContent className="p-4 sm:p-5">
        <p className="text-[13px] text-muted-foreground">{label}</p>
        <p
          className={cn(
            'mt-1.5 text-[20px] font-bold tabular-nums',
            tone === 'accent' ? 'text-primary' : 'text-foreground',
          )}
        >
          {value}
        </p>
        {hint && <p className="mt-1 text-[12px] text-muted-foreground">{hint}</p>}
      </CardContent>
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
      <div className="flex items-center justify-between gap-2">
        <p className="text-[13px] text-muted-foreground">
          مصروفات رواتب الفرع النشط خلال الفترة المحددة
        </p>
        <Button
          type="button"
          variant="outline"
          onClick={() => window.print()}
          className="receipt-no-print h-11 shrink-0 gap-2 rounded-full touch-target"
        >
          <Printer className="size-4" />
          طباعة
        </Button>
      </div>

      <Card className="receipt-no-print rounded-[14px] elevation-card">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-end gap-2">
            <div className="flex flex-wrap gap-1.5">
              {periodPresets.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setPreset(option.value)}
                  className={cn(
                    'h-11 rounded-full border px-4 text-[13px] font-semibold transition-colors touch-target',
                    preset === option.value
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-black/10 bg-white text-muted-foreground',
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {preset === 'custom' && (
              <div className="flex items-end gap-2">
                <div className="flex w-[150px] flex-col gap-1">
                  <label
                    htmlFor="salary-from-date"
                    className="text-[12px] text-muted-foreground"
                  >
                    من تاريخ
                  </label>
                  <Input
                    id="salary-from-date"
                    type="date"
                    value={customRange.startDate}
                    max={toDateInputValue(new Date())}
                    onChange={(e) =>
                      setCustomRange((r) => ({ ...r, startDate: e.target.value }))
                    }
                    className="h-11 touch-target rounded-full"
                  />
                </div>
                <div className="flex w-[150px] flex-col gap-1">
                  <label
                    htmlFor="salary-to-date"
                    className="text-[12px] text-muted-foreground"
                  >
                    إلى تاريخ
                  </label>
                  <Input
                    id="salary-to-date"
                    type="date"
                    value={customRange.endDate}
                    max={toDateInputValue(new Date())}
                    onChange={(e) =>
                      setCustomRange((r) => ({ ...r, endDate: e.target.value }))
                    }
                    className="h-11 touch-target rounded-full"
                  />
                </div>
              </div>
            )}
          </div>

          {data && (
            <p className="mt-2 text-[12px] text-muted-foreground">
              من {formatDay(data.startDate)} إلى {formatDay(data.endDate)}
            </p>
          )}

          {!rangeIsValid && (
            <p className="mt-2 text-[13px] font-medium text-error">
              تاريخ البدء لا يمكن أن يكون بعد تاريخ الانتهاء.
            </p>
          )}
        </CardContent>
      </Card>

      {!hasValidBranch ? (
        <p className="text-[14px] text-muted-foreground">
          لا يوجد فرع محدد. اختر فرعاً من أعلى الصفحة لعرض أجوره.
        </p>
      ) : isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-24 rounded-[14px]" />
          <Skeleton className="h-64 rounded-[14px]" />
        </div>
      ) : isError ? (
        <p className="text-[14px] font-medium text-error">تعذّر تحميل كشف الأجور.</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            <StatCard
              label="إجمالي الأجور"
              value={formatEgp(data?.totalAmount ?? 0)}
              tone="accent"
              hint="مصروفات رواتب الفترة"
            />
            <StatCard
              label="عدد الموظفين"
              value={formatNumber(data?.employeesCount ?? 0)}
              hint="موظف واحد على الأقل"
            />
            <StatCard
              label="عدد صرفات الرواتب"
              value={formatNumber(data?.paymentsCount ?? 0)}
              hint="سطر راتب مسجَّل"
            />
          </div>

          <Card className="rounded-[14px] elevation-card">
            <CardContent className="p-4 sm:p-5">
              <p className="mb-3 text-[15px] font-semibold text-foreground">
                توزيع الأجور على الموظفين
              </p>

              {employees.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>الموظف</TableHead>
                        <TableHead>عدد الصرفات</TableHead>
                        <TableHead className="text-start">الإجمالي</TableHead>
                        <TableHead>النسبة</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {employees.map((employee) => {
                        const share =
                          (data?.totalAmount ?? 0) > 0
                            ? (employee.totalAmount / (data?.totalAmount ?? 1)) * 100
                            : 0
                        return (
                          <TableRow key={employee.employeeId ?? employee.employeeName}>
                            <TableCell className="text-[13px] font-semibold">
                              {employee.employeeName}
                            </TableCell>
                            <TableCell className="text-[13px] tabular-nums">
                              {formatNumber(employee.paymentsCount)}
                            </TableCell>
                            <TableCell className="text-[13px] font-bold tabular-nums text-success">
                              {formatEgp(employee.totalAmount)}
                            </TableCell>
                            <TableCell className="text-[13px] tabular-nums text-muted-foreground">
                              {formatNumber(share)}%
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
                  <Wallet className="size-10 text-muted-foreground" />
                  <p className="text-[15px] font-semibold text-foreground">
                    لا توجد رواتب في هذه الفترة
                  </p>
                  <p className="text-sm text-muted-foreground">
                    سجّل مصروفاً تصنيفه «راتب» من تبويب المصروفات ليظهر هنا.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
