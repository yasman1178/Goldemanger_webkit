import { createBrowserRouter, RouterProvider } from 'react-router-dom'

import { AppLayout } from '@/app/AppLayout'
import { ProtectedRoute } from '@/app/ProtectedRoute'
import { LandingPage } from '@/features/public-site/pages/LandingPage'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { DashboardPage } from '@/features/dashboard/pages/DashboardPage'
import { ProductsPage } from '@/features/products/pages/ProductsPage'
import { PublicProductPage } from '@/features/products/pages/PublicProductPage'
import { SalesPage } from '@/features/sales/pages/SalesPage'
import { PurchasesPage } from '@/features/purchases/pages/PurchasesPage'
import { PurchaseCreatePage } from '@/features/purchases/pages/PurchaseCreatePage'
import { InventoryPage } from '@/features/inventory/pages/InventoryPage'
import { CashPage } from '@/features/cash/pages/CashPage'
import { DebtsPage } from '@/features/debts/pages/DebtsPage'
import { DebtReportPage } from '@/features/debts/pages/DebtReportPage'
import { SalesHistoryPage } from '@/features/sales/pages/SalesHistoryPage'
import { ExpensesPage } from '@/features/expenses/pages/ExpensesPage'
import { EmployeeDebtsPage } from '@/features/employee-debts/pages/EmployeeDebtsPage'
import { SettingsPage } from '@/features/settings/pages/SettingsPage'
import { AdminPage } from '@/features/admin/pages/AdminPage'

const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingPage />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/products/:productId',
    element: <PublicProductPage />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: '/app',
        element: <AppLayout />,
        children: [
          { index: true, element: <DashboardPage /> },
          { path: 'products', element: <ProductsPage /> },
          { path: 'sales', element: <SalesPage /> },
          { path: 'sales/history', element: <SalesHistoryPage /> },
          { path: 'purchases', element: <PurchasesPage /> },
          { path: 'purchases/new', element: <PurchaseCreatePage /> },
          { path: 'inventory', element: <InventoryPage /> },
          { path: 'cash', element: <CashPage /> },
          { path: 'debts', element: <DebtsPage /> },
          { path: 'debts/report', element: <DebtReportPage /> },
          { path: 'expenses', element: <ExpensesPage /> },
          { path: 'employee-debts', element: <EmployeeDebtsPage /> },
          { path: 'settings', element: <SettingsPage /> },
          { path: 'admin', element: <AdminPage /> },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <LandingPage />,
  },
])

export function AppRouter() {
  return <RouterProvider router={router} />
}
