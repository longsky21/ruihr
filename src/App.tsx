import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import 'dayjs/locale/zh-cn';
import dayjs from 'dayjs';
import AppLogin from './pages/app/Login';
import AdminLogin from './pages/admin/Login';
import AdminLayout from './layouts/AdminLayout';
import AppLayout from './layouts/AppLayout';
import { useAuthStore } from './store/useAuthStore';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminEmployees from './pages/admin/Employees';
import AdminDepartments from './pages/admin/Departments';
import AdminSalary from './pages/admin/Salary';

// App Pages
import AppProfile from './pages/app/Profile';
import AppClockIn from './pages/app/ClockIn';
import AppOA from './pages/app/OA';

// PC Pages (now under /admin)
import PCLayout from './pages/admin/PCLayout';
import Organization from './pages/admin/Organization';
import Employees from './pages/admin/Employees';
import Records from './pages/admin/attendance/Records';
import Report from './pages/admin/attendance/Report';
import OfficeLocations from './pages/admin/attendance/OfficeLocations';

const AppProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  if (!isAuthenticated) {
    return <Navigate to="/app/login" replace />;
  }
  return children;
};

const AdminProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }
  return children;
};

export default function App() {
  const checkAuth = useAuthStore((state) => state.checkAuth);

  useEffect(() => {
    dayjs.locale('zh-cn');
    checkAuth();
  }, [checkAuth]);

  return (
    <ConfigProvider locale={zhCN}>
      <BrowserRouter>
        <Routes>
          {/* App Routes */}
          <Route path="/app/login" element={<AppLogin />} />
          <Route path="/app" element={<AppProtectedRoute><AppLayout /></AppProtectedRoute>}>
            <Route index element={<Navigate to="clock-in" replace />} />
            <Route path="clock-in" element={<AppClockIn />} />
            <Route path="oa" element={<AppOA />} />
            <Route path="profile" element={<AppProfile />} />
          </Route>

          {/* Admin Routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminProtectedRoute><PCLayout /></AdminProtectedRoute>}>
            <Route index element={<Navigate to="organization" replace />} />
            <Route path="organization" element={<Organization />} />
            <Route path="employees" element={<Employees />} />
            <Route path="attendance/records" element={<Records />} />
            <Route path="attendance/report" element={<Report />} />
            <Route path="attendance/locations" element={<OfficeLocations />} />
          </Route>

          <Route path="/" element={<Navigate to="/app" replace />} />
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  );
}
