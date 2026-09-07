# frontend.md — دليلك السريع للمكونات في Goldemanger_webkit

> يشرح كيف يُبنى أي مكوّن/صفحة جديدة على هذا الـ Frontend، وكيف ترتبط بالمكونات الجديدة التي أُضيفت مؤخراً (الدفع بالبطاقة/التحويل + تقرير المديونيات المفصل).

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

## 6) خطوات إضافة صفحة/مكوّن جديد (الاختصار)

1. أنشئ الملف تحت `src/features/<feature>/pages/` (صفحة) أو `components/` (مكوّن).
2. ضع كل البيانات والـ hooks في `api.ts` و `types.ts` داخل نفس الـ feature (DRY عبر الـ feature فقط).
3. اربط الصفحة في `src/app/router.tsx` (`{ path: '...', element: <Page /> }`).
4. أضف بند القائمة في `src/app/AppLayout.tsx` (مصفوفة القائمة الجانبية) إن كانت الصفحة من الصفحات الرئيسية.
5. تحقق بالترتيب: `npm.cmd run typecheck` ← `npm.cmd run lint` ← `npm.cmd test` ← `npm.cmd run build`.

> ⚠️ ملاحظة lint قائمة: `src/shared/hooks/usePwaInstall.ts` لديه خطأ `set-state-in-effect` قديم غير متعلق بهذه المكونات — لا تصلحه إلا بطلب صريح. وتحذير `AddPieceDialog.tsx` (fast-refresh) معروف ومقبول.