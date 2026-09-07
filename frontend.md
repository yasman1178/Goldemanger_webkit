# frontend.md — دليلك السريع للمكونات في Goldemanger_webkit

> يشرح كيف يُبنى أي مكوّن/صفحة جديدة على هذا الـ Frontend، وكيف ترتبط بالمكونات الجديدة التي أُضيفت مؤخراً (الدفع بالبطاقة/التحويل + تقرير المديونيات المفصل + الترقيم الحقيقي).

## 1) خارطة البنية (قبل أي كود)

```
src/
├── app/            # App + Router + AppLayout (القائمة الجانبية)
├── shared/
│   ├── components/ui/   # shadcn/ui (button, card, dialog, table, input, ...)
│   ├── hooks/           # useActiveBranchId, usePwaInstall, ...
│   ├── lib/             # api.ts (axios + تجديد JWT)، gold.ts، utils.ts، parties.ts، invalidateShop.ts
│   ├── types/api.ts     # أنواع الـ Backend المشتركة (CashRecord, TransactionType, ...)
│   └── styles/          # Tailwind v4
└── features/
    ├── sales/           # POS — فيه PaymentDialog.tsx
    ├── cash/            # الخزينة — CashPage.tsx
    ├── debts/           # المديونيات — DebtsPage + DebtReportPage
    └── ...              # products, purchases, inventory, dashboard, ...
```

## 2) شروط كل مكوّن جديد (مهمة)

- **RTL + Tablet-First**: كل التصميم عربي من اليمين لليسار؛ الأزرار ≥ 44px (`touch-target` class)؛ الخرائط `800–1280px`.
- **الأسلوب**: Apple Style + Action Blue (`primary`). الكروت: `rounded-[14px] elevation-card`. الجداول عبر `ui/table` مع `TableRow` عادية، والعدادات `tabular-nums`.
- **الألوان الدلالية**: `text-success` للناجح/المدفوع، `text-warning` للمتبقي/التحذير، `text-error` للأخطاء، `text-muted-foreground` للثانوي.
- **البيانات**: React Query دائماً (`useQuery`/`useMutation`) — لا fetch يدوي. المفاتيح: `['debts', branchId]`، `['sales-history', branchId]`، ...
- **الأرقام والمال**: `formatEgp(number)` من `@/shared/lib/utils`، والإدخال المالي عبر `amountToNumber` من `@/shared/lib/gold`.

## 3) الدفع بالبطاقة/التحويل (المكوّن المُحدّث: `PaymentDialog.tsx`)

- ملف: `src/features/sales/components/pos/PaymentDialog.tsx`.
- طريقة الدفع ثلاثة: `cash | card | transfer` في مصفوفة `methods`.
- **منطق التسوية** داخل `mutation.mutationFn`:
  - `isCash = method === 'cash'`
  - `paidAmount = isCash ? paidValue : Math.min(paidValue, totals.total)` — للبطاقة يُرسَل المبلغ الفعلي المكتوب (المقصوص على الإجمالي).
  - `amountOwed = isCash ? max(0, total - paidValue) : 0` — **البطاقة/التحويل لا تُنشئ مديونية أبداً**.
  - `paymentMethod: method` يُرسَل مع الفاتورة.
- **الخزينة**: الـ Backend يسجّل حركة `CardSale` («بيع بالبطاقة - فاتورة #id») أو `TransferSale` وتظهر في `CashPage.tsx` كرصيد بطاقة/محفظة (وليس نقداً).
- **الدفع الجزئي بالبطاقة**: اكتب مبلغاً أقل من الإجمالي والباقي يظهر «المتبقي سيُدفع نقداً» — يُستلم كاش على الكاشير والفاتورة تُسوَّى (لا دين).
- **ملاحظات قواعد**: `handleOpenChange` يصفّر `paid`/`method` عند كل فتح (لا `useEffect` — يمنع خطأ `set-state-in-effect` في lint)؛ `selectMethod` يملأ `paid` بالإجمالي تلقائياً عند البطاقة/التحويل.

## 4) تقرير المديونيات المفصل (المكوّن الجديد: `DebtReportPage.tsx`)

- ملف: `src/features/debts/pages/DebtReportPage.tsx` — المسار `/app/debts/report` (مسجّل في `src/app/router.tsx`) + زر «التقرير المفصل» في `DebtsPage.tsx`.
- مسار الـ API: `GET /api/Debts/ClientSummary?branchId=` → `getClientSummary(branchId)` من `src/features/debts/api.ts`.
- الشكل: ملخص عميل واحد في صف `{clientName, clientPhone, invoiceCount, totalOwed, totalPaid, remaining}` + بحث بالاسم/الهاتف + 4 كروت إجمالية (عدد/مستحق/مدفوع/متبقي).
- عند اختيار عميل → `ClientDetail` يعرض كل ديونه (`getClientDebts(clientId)`) **مرتبة بتاريخ الاستحقاق** مع صف **«الإجمالي» في النهاية** كخاتمة الجدول.
- إضافة مكوّن داخلي مشابه؟ حوّل `ClientDetail`/`DebtRow` إلى ملف منفصل في `components/` إذا استُخدم من صفحة أخرى (قاعدة fast-refresh في lint تفضّل ملفات تحتوي components فقط).

## 5) أنواع البيانات الجديدة التي يجب استيرادها

| المكان | الأنواع/التصدير | الوصف |
|---|---|---|
| `src/shared/types/api.ts` | `TransactionType` فيه `'CardSale' | 'TransferSale'` + تسميات | للخزينة وعمليات الكاش |
| `src/features/sales/types.ts` | `CreateSalePayload.paymentMethod?: 'cash' | 'card' | 'transfer'` | لإرسال الفاتورة |
| `src/features/debts/types.ts` | `DebtClientSummary` | صف الملخص من `ClientSummary` |
| `src/features/debts/api.ts` | `getClientSummary` / `getClientDebts` | قراءة التقرير |
| `src/shared/lib/pagination.ts` | `PAGE_SIZE`، `PaginatedResult<T>`، `totalPages()`، `usePaginablePage(...)` | الترقيم الحقيقي |
| `src/shared/components/ui/pagination.tsx` | `PaginationBar` | شريط الترقيم RTL |

## 6) خطوات إضافة صفحة/مكوّن جديد (الاختصار)

1. أنشئ الملف تحت `src/features/<feature>/pages/` (صفحة) أو `components/` (مكوّن).
2. ضع كل البيانات والـ hooks في `api.ts` و `types.ts` داخل نفس الـ feature (DRY عبر الـ feature فقط).
3. اربط الصفحة في `src/app/router.tsx` (`{ path: '...', element: <Page /> }`).
4. أضف بند القائمة في `src/app/AppLayout.tsx` (مصفوفة القائمة الجانبية) إن كانت الصفحة من الصفحات الرئيسية.
5. تحقق بالترتيب: `npm.cmd run typecheck` ← `npm.cmd run lint` ← `npm.cmd test` ← `npm.cmd run build`.

## 7) الترقيم الحقيقي (Server-Side) — 10 صفوف/صفحة

> **عقد الترقيم**: `GET ...?page=&pageSize=10&q=&<فلاتر>` → عند وجود `page` يُرجع `PaginatedResult<T>` ؛ بدون `page` يُرجع القائمة كاملة (توافق رجعي). صفحات مروّسة بالفعل: منتجات، سجل المبيعات، خزينة، ديون، مشتريات، جرد (جدول الوحدات). **الاستثناءات التي تبقى كاملة**: POS/ProductGrid (بحث فوري/باركود من الذاكرة)، ملخص منتجات لوحة الجرد، لوحة التحكم/التقارير، والإيصالات.

- **المشترك**:
  - `src/shared/lib/pagination.ts` — `PAGE_SIZE = 10`، `PaginatedResult<T> { totalCount, page, pageSize, totalPages, data, carryAmount? }`، `totalPages()`، وhook **`usePaginablePage(totalCount, page, PAGE_SIZE, setPage)`** → `{ page: safePage, pageCount, goToPage, reset }`.
  - `src/shared/components/ui/pagination.tsx` — `PaginationBar` (prop **`onChange`** — ليس `onPageChange`)، يختفي عند `pageCount <= 1`، ويُمرَّر له `totalCount`.
- **نمط الصفحة (إلزامي)** — لأن `page` state تسبق الاستعلام (دورة تعتمدية):
  1. `const [page, setPage] = useState(1)` **قبل** الـ `useQuery`.
  2. ضع `page` + كل الفلاتر في `queryKey` (الـ `reset()` يعيد `page` لـ 1 عند أي تغيير فلتر/بحث).
  3. `const { data } = useQuery({ ..., queryFn: () => getXPage({ branchId, page, q, ... }) })` — استدعِ دالة `getXPage` الخاصة بالصفحة من `api.ts` لا القائمة الكاملة.
  4. `const units = data?.data` لصفوف الصفحة، و`data?.totalCount` للعدادات.
  5. `<PaginationBar page={safePage} pageCount={pageCount} onChange={goToPage} totalCount={data?.totalCount ?? 0} />`.
- **`PaginatedResult<T>`** مخططه مطابق للـ Backend (`PaginatedResult.cs` في `GoldeManger.Core/Dor/PaginatedResult.cs`) — أي حقل جديد يُضاف هنا تلقائياً للـ API.
- **carryAmount** (خزينة فقط): رصيد آخر حركة قبل أقدم صف بالصفحة — يحسب «المبلغ المؤثر» عبر الصفحات (`delta = amount − prev`، ولأقدم صف `amount − carryAmount`).
- **الملخصات/البطاقات الإحصائية (ديون، خزينة)**: احسبها من **مصدر كامل منفصل** (مثل `GET /api/Debts/BranchSummary/{branchId}`) — **لا** تُشتق من صفوف الصفحة الحالية (ستعطي رقماً خاطئاً عند التنقل).
- **إضافة ترقيم لصفحة جديدة**: (1) اربط دالة `getXPage` على الـ endpoint المروّس في `api.ts`؛ (2) طبّق نمط الصفحة أعلاه؛ (3) `npm.cmd run typecheck` ثم `lint` ثم `test` ثم `build`.