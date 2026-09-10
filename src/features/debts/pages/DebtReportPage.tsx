import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Wallet,
  ArrowLeft,
  Search,
  Printer,
  FileText,
  Phone,
  Users,
} from 'lucide-react'

import { getClientDebts, getClientSummary } from '@/features/debts/api'
import {
  getDebtStatus,
  debtStatusLabels,
  type Debt,
  type DebtClientSummary,
} from '@/features/debts/types'
import { useActiveBranchId } from '@/shared/hooks/useActiveBranchId'
import { formatEgp, cn } from '@/shared/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
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

function formatDate(value: string): string {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return new Intl.DateTimeFormat('ar-EG', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(d)
}

const statusVariant: Record<string, 'default' | 'destructive' | 'secondary' | 'outline'> = {
  unpaid: 'secondary',
  partial: 'outline',
  paid: 'default',
  overdue: 'destructive',
}

export function DebtReportPage() {
  const activeBranchId = useActiveBranchId()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedClient, setSelectedClient] = useState<DebtClientSummary | null>(null)

  const { data: summary = [], isLoading, isError } = useQuery({
    queryKey: ['debts-client-summary', activeBranchId],
    queryFn: () => getClientSummary(activeBranchId ?? 0),
    enabled: !!activeBranchId,
    select: (data) => (Array.isArray(data) ? data : []),
  })

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return summary
    return summary.filter((s) => {
      const name = (s.clientName ?? '').toLowerCase()
      const phone = (s.clientPhone ?? '').toLowerCase()
      return name.includes(q) || phone.includes(q)
    })
  }, [summary, searchQuery])

  const totals = useMemo(
    () => ({
      owed: summary.reduce((acc, s) => acc + s.totalOwed, 0),
      paid: summary.reduce((acc, s) => acc + s.totalPaid, 0),
      debit: summary.reduce((acc, s) => acc + s.debitRemaining, 0),
      credit: summary.reduce((acc, s) => acc + s.creditRemaining, 0),
      remaining: summary.reduce((acc, s) => acc + s.remaining, 0),
      clients: summary.length,
    }),
    [summary],
  )

  if (selectedClient) {
    return (
      <ClientDetail client={selectedClient} onBack={() => setSelectedClient(null)} />
    )
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-[34px] font-bold leading-[1.2] text-foreground">
            تقرير المديونيات المفصل
          </h1>
          <p className="text-muted-foreground">ملخص كل عميل مع إجمالي مديونيته</p>
        </div>
        {filtered.length > 0 && (
          <Button
            type="button"
            variant="outline"
            onClick={() => window.print()}
            className="h-11 rounded-full touch-target"
          >
            <Printer className="size-4" />
            طباعة
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card size="sm" className="rounded-[14px] elevation-card">
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-2 text-[13px] font-semibold leading-[1.35] text-muted-foreground">
              <span>العملاء المدينة</span>
              <Users className="size-4 text-primary/60" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="tabular-nums text-[24px] font-bold leading-[1.1] text-foreground">
              {totals.clients}
            </div>
          </CardContent>
        </Card>
        <Card size="sm" className="rounded-[14px] elevation-card">
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-2 text-[13px] font-semibold leading-[1.35] text-muted-foreground">
              <span>إجمالي متبقي عليهم (مدين)</span>
              <Wallet className="size-4 text-warning/60" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="tabular-nums text-[24px] font-bold leading-[1.1] text-warning">
              {formatEgp(totals.debit)}
            </div>
          </CardContent>
        </Card>
        <Card size="sm" className="rounded-[14px] elevation-card">
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-2 text-[13px] font-semibold leading-[1.35] text-muted-foreground">
              <span>إجمالي متبقي لهم (دائن)</span>
              <FileText className="size-4 text-success/60" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="tabular-nums text-[24px] font-bold leading-[1.1] text-success">
              {formatEgp(totals.credit)}
            </div>
          </CardContent>
        </Card>
        <Card size="sm" className="rounded-[14px] elevation-card">
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-2 text-[13px] font-semibold leading-[1.35] text-muted-foreground">
              <span>متبقّي (مدين − دائن)</span>
              <Wallet className="size-4 text-primary/60" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="tabular-nums text-[24px] font-bold leading-[1.1] text-primary">
              {formatEgp(totals.remaining)}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="relative">
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="ابحث بإجمالي مديونية العميل — الاسم أو الهاتف..."
          className="search-field h-12 touch-target ps-10"
        />
        <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-2xl" />
          ))}
        </div>
      ) : isError ? (
        <div className="flex items-center justify-center py-20 text-error">
          تعذّر تحميل تقرير المديونيات.
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-black/10 bg-white py-20 text-center">
          <Wallet className="size-12 text-muted-foreground" />
          <p className="text-[17px] font-semibold text-foreground">
            {searchQuery ? 'لا توجد نتائج' : 'لا توجد مديونيات'}
          </p>
          <p className="text-sm text-muted-foreground">
            {searchQuery
              ? 'جرّب بحثاً مختلفاً.'
              : 'ستظهر هنا ملخصات مديونيات العملاء.'}
          </p>
        </div>
      ) : (
        <Card className="elevation-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>العميل</TableHead>
                <TableHead>الهاتف</TableHead>
                <TableHead>الفواتير</TableHead>
                <TableHead>متبقّي مدين (عليه)</TableHead>
                <TableHead>متبقّي دائن (له)</TableHead>
                <TableHead>الصافي</TableHead>
                <TableHead className="text-end">التقرير التفصيلي</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((s) => (
                <TableRow key={s.clientId}>
                  <TableCell className="font-semibold text-foreground">
                    {s.clientName ?? `عميل #${s.clientId}`}
                  </TableCell>
                  <TableCell className="tabular-nums text-muted-foreground" dir="ltr">
                    {s.clientPhone || '—'}
                  </TableCell>
                  <TableCell className="tabular-nums">
                    <Badge variant="secondary">{s.invoiceCount}</Badge>
                  </TableCell>
                  <TableCell className="tabular-nums text-warning">
                    {formatEgp(s.debitRemaining)}
                  </TableCell>
                  <TableCell className="tabular-nums text-success">
                    {formatEgp(s.creditRemaining)}
                  </TableCell>
                  <TableCell
                    className={cn(
                      'tabular-nums font-semibold',
                      s.remaining >= 0 ? 'text-warning' : 'text-success',
                    )}
                  >
                    {formatEgp(s.remaining)}
                  </TableCell>
                  <TableCell className="text-end">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedClient(s)}
                      className="rounded-full touch-target"
                    >
                      <FileText className="size-3.5" />
                      التفاصيل
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="grid grid-cols-2 gap-3 border-t border-black/5 bg-muted/40 px-4 py-3 lg:grid-cols-4">
            <div className="flex justify-between text-[13px]">
              <span className="text-muted-foreground">إجمالي متبقي مدين</span>
              <span className="font-bold tabular-nums text-warning">{formatEgp(totals.debit)}</span>
            </div>
            <div className="flex justify-between text-[13px]">
              <span className="text-muted-foreground">إجمالي متبقي دائن</span>
              <span className="font-bold tabular-nums text-success">{formatEgp(totals.credit)}</span>
            </div>
            <div className="flex justify-between text-[13px]">
              <span className="text-muted-foreground">الصافي (مدين − دائن)</span>
              <span className="font-bold tabular-nums text-primary">{formatEgp(totals.remaining)}</span>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}

function ClientDetail({
  client,
  onBack,
}: {
  client: DebtClientSummary
  onBack: () => void
}) {
  const { data: debts = [], isLoading } = useQuery({
    queryKey: ['debts', 'client', client.clientId],
    queryFn: () => getClientDebts(client.clientId),
    select: (data) => (Array.isArray(data) ? data : []),
  })

  const sorted = useMemo(
    () => [...debts].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()),
    [debts],
  )

  const detailTotals = useMemo(
    () => ({
      owed: sorted.reduce((acc, d) => acc + d.amountOwed, 0),
      paid: sorted.reduce((acc, d) => acc + d.paidAmount, 0),
      debit: sorted.reduce(
        (acc, d) =>
          acc + ((d.debtType === 0 ? d.amountOwed - d.paidAmount : 0) as number),
        0,
      ),
      credit: sorted.reduce(
        (acc, d) =>
          acc + ((d.debtType === 1 ? d.amountOwed - d.paidAmount : 0) as number),
        0,
      ),
    }),
    [sorted],
  )

  return (
    <div className="space-y-6 pb-20">
      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={onBack}
              className="rounded-full touch-target"
              aria-label="رجوع للتقرير العام"
            >
              <ArrowLeft className="size-4" />
            </Button>
            <div>
              <h1 className="text-[30px] font-bold leading-[1.2] text-foreground">
                {client.clientName ?? `عميل #${client.clientId}`}
              </h1>
              <p className="mt-1 flex items-center gap-1.5 text-[13px] text-muted-foreground" dir="ltr">
                <Phone className="size-3.5" />
                {client.clientPhone || '—'}
              </p>
            </div>
          </div>
          <div className="text-end">
            <div className="text-[12px] font-semibold text-muted-foreground">
              الصافي (مدين − دائن)
            </div>
            <div
              className={cn(
                'tabular-nums text-[24px] font-bold leading-[1.1]',
                detailTotals.debit - detailTotals.credit >= 0
                  ? 'text-warning'
                  : 'text-success',
              )}
            >
              {formatEgp(detailTotals.debit - detailTotals.credit)}
            </div>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-2xl" />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-black/10 bg-white py-20 text-center">
          <Wallet className="size-12 text-muted-foreground" />
          <p className="text-[17px] font-semibold text-foreground">لا توجد ديون</p>
        </div>
      ) : (
        <Card className="elevation-card overflow-hidden">
          <div className="flex items-center justify-between bg-primary/5 px-4 py-3">
            <h2 className="text-[15px] font-bold text-foreground">
              فواتير العميل ({sorted.length})
            </h2>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => window.print()}
              className="rounded-full touch-target"
              aria-label="طباعة"
            >
              <Printer className="size-4" />
            </Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الفاتورة</TableHead>
                <TableHead>النوع</TableHead>
                <TableHead>تاريخ الاستحقاق</TableHead>
                <TableHead>المستحق</TableHead>
                <TableHead>المدفوع</TableHead>
                <TableHead>المتبقي</TableHead>
                <TableHead className="text-end">الحالة</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((debt) => (
                <DebtRow key={debt.debtId} debt={debt} />
              ))}
              <TableRow className="bg-muted/50 font-bold">
                <TableCell colSpan={3} className="text-foreground">
                  الإجمالي
                </TableCell>
                <TableCell className="tabular-nums text-foreground">
                  {formatEgp(detailTotals.owed)}
                </TableCell>
                <TableCell className="tabular-nums text-success">
                  {formatEgp(detailTotals.paid)}
                </TableCell>
                <TableCell className="tabular-nums text-warning">
                  {formatEgp(detailTotals.debit - detailTotals.credit)}
                </TableCell>
                <TableCell />
              </TableRow>
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  )
}

function DebtRow({ debt }: { debt: Debt }) {
  const status = getDebtStatus(debt)
  const remaining = Math.max(
    0,
    debt.balanceType === 1
      ? Math.round((debt.amountOwed - debt.paidAmount) * 100) / 100
      : Math.round(debt.amountOwed - debt.paidAmount),
  )
  const isCredit = debt.debtType === 1
  return (
    <TableRow>
      <TableCell className="tabular-nums font-semibold text-primary" dir="ltr">
        #{debt.saleId ?? debt.debtId}
      </TableCell>
      <TableCell>
        <span className="flex flex-wrap items-center gap-1">
          <Badge variant={isCredit ? 'default' : 'secondary'}>
            {isCredit ? 'دائن' : 'مدين'}
          </Badge>
          {debt.balanceType === 1 && (
            <Badge variant="outline">ذهب {debt.amountOwed} جم</Badge>
          )}
          {debt.description && (
            <span className="block w-full text-[11px] font-normal text-muted-foreground">
              {debt.description}
            </span>
          )}
        </span>
      </TableCell>
      <TableCell className="tabular-nums text-muted-foreground">
        {formatDate(debt.dueDate)}
      </TableCell>
      <TableCell className="tabular-nums">
        {debt.balanceType === 1 ? `${debt.amountOwed} جم` : formatEgp(debt.amountOwed)}
      </TableCell>
      <TableCell className="tabular-nums text-success">
        {debt.balanceType === 1 ? `${debt.paidAmount} جم` : formatEgp(debt.paidAmount)}
      </TableCell>
      <TableCell
        className={cn(
          'tabular-nums font-semibold',
          remaining <= 0 ? 'text-success' : isCredit ? 'text-success' : 'text-warning',
        )}
      >
        {debt.balanceType === 1 ? `${remaining} جم` : formatEgp(remaining)}
      </TableCell>
      <TableCell className="text-end">
        <Badge variant={statusVariant[status]}>
          {debtStatusLabels[status]}
        </Badge>
      </TableCell>
    </TableRow>
  )
}