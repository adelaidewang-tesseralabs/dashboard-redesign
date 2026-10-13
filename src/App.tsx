import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { DashboardsProvider } from './data/DashboardsStore'
import { AppShell } from './nav/AppShell'
import { EmptyPage } from './pages/EmptyPage'
import { CustomDashboardsPage } from './pages/insights/custom/CustomDashboardsPage'
import { DashboardDetailPage } from './pages/insights/detail/DashboardDetailPage'
import { SystemDashboardsPage } from './pages/insights/system/SystemDashboardsPage'
import { ToastProvider } from './ui/Toast'

export function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <DashboardsProvider>
          <Routes>
            <Route element={<AppShell />}>
              <Route index element={<Navigate to="/insights/dashboards" replace />} />
              <Route path="insights">
                <Route index element={<Navigate to="/insights/dashboards" replace />} />
                <Route path="dashboards" element={<CustomDashboardsPage />} />
                <Route path="dashboards/:dashboardId" element={<DashboardDetailPage />} />
                <Route path="system-dashboards" element={<SystemDashboardsPage />} />
              </Route>
              <Route path="*" element={<EmptyPage />} />
            </Route>
          </Routes>
        </DashboardsProvider>
      </ToastProvider>
    </BrowserRouter>
  )
}
