import { Navigate, Route, Routes } from 'react-router-dom';
import { Toaster } from './shared/components/Toaster';
import { ProtectedRoute } from './shared/components/ProtectedRoute';

import MenuPage from './apps/customer/MenuPage';
import CheckoutPage from './apps/customer/CheckoutPage';
import OrderTrackPage from './apps/customer/OrderTrackPage';

import AdminLoginPage from './apps/admin/LoginPage';
import AdminLayout from './apps/admin/AdminLayout';
import DashboardPage from './apps/admin/DashboardPage';
import MenuManagerPage from './apps/admin/MenuManagerPage';
import TablesPage from './apps/admin/TablesPage';
import QrCodesPage from './apps/admin/QrCodesPage';
import OrdersPage from './apps/admin/OrdersPage';
import StaffPage from './apps/admin/StaffPage';
import ReportsPage from './apps/admin/ReportsPage';
import SettingsPage from './apps/admin/SettingsPage';

import ChefLoginPage from './apps/chef/ChefLoginPage';
import ChefLayout from './apps/chef/ChefLayout';
import KdsPage from './apps/chef/KdsPage';

export default function App() {
  return (
    <>
      <Routes>
        {/* ---------- Customer ---------- */}
        <Route path="/menu/:qrToken" element={<MenuPage />} />
        <Route path="/menu/:qrToken/checkout" element={<CheckoutPage />} />
        <Route path="/menu/:qrToken/order/:orderId" element={<OrderTrackPage />} />

        {/* ---------- Admin / Staff ---------- */}
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route element={<ProtectedRoute roles={['ADMIN', 'STAFF']} loginPath="/admin/login" />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="menu" element={<MenuManagerPage />} />
            <Route path="tables" element={<TablesPage />} />
            <Route path="qr-codes" element={<QrCodesPage />} />
            <Route path="orders" element={<OrdersPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route element={<ProtectedRoute roles={['ADMIN']} loginPath="/admin/login" />}>
              <Route path="staff" element={<StaffPage />} />
            </Route>
          </Route>
        </Route>

        {/* ---------- Chef ---------- */}
        <Route path="/chef/login" element={<ChefLoginPage />} />
        <Route element={<ProtectedRoute roles={['CHEF', 'ADMIN']} loginPath="/chef/login" />}>
          <Route path="/chef" element={<ChefLayout />}>
            <Route index element={<KdsPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/admin/login" replace />} />
      </Routes>
      <Toaster />
    </>
  );
}