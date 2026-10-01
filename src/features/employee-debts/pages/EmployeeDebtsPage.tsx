import { Navigate } from 'react-router-dom'

/**
 * دمجت شاشة السلف مع شاشة المصروفات والأجور في شاشة موحدة (§ExpensesPage)
 * نُعيد التوجيه التلقائي إلى تبويب السلف داخل الشاشة الموحدة مع الحفاظ على التوافق الكامل.
 */
export function EmployeeDebtsPage() {
  return <Navigate to="/app/expenses?tab=advances" replace />
}
