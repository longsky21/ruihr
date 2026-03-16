import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import 'dayjs/locale/zh-cn';
import dayjs from 'dayjs';
import Login from './pages/Login';
import AdminLogin from './pages/AdminLogin';
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

// PC Pages
import PCLayout from './pages/pc/PCLayout';
import Organization from './pages/pc/Organization';
import Employees from './pages/pc/Employees';
import AttendanceLayout from './pages/pc/attendance/AttendanceLayout';
import Records from './pages/pc/attendance/Records';
import Report from './pages/pc/attendance/Report';

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
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
          <Route path="/login" element={<Login />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          
          {/* Admin Routes */}
          <Route path="/pc" element={<ProtectedRoute><PCLayout /></ProtectedRoute>}>
            <Route index element={<Navigate to="organization" replace />} />
            <Route path="organization" element={<Organization />} />
            <Route path="employees" element={<Employees />} />
            <Route path="attendance" element={<AttendanceLayout />}>
              <Route index element={<Navigate to="records" replace />} />
              <Route path="records" element={<Records />} />
              <Route path="report" element={<Report />} />
            </Route>
          </Route>

          <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="employees" element={<AdminEmployees />} />
            <Route path="departments" element={<AdminDepartments />} />
            <Route path="salary" element={<AdminSalary />} />
          </Route>

          {/* App Routes */}
          <Route path="/app" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route index element={<Navigate to="clock-in" replace />} />
            <Route path="clock-in" element={<AppClockIn />} />
            <Route path="oa" element={<AppOA />} />
            <Route path="profile" element={<AppProfile />} />
          </Route>

          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  );
}
