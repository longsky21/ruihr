import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Users, FileText, Settings, LayoutDashboard } from 'lucide-react';

export default function AdminLayout() {
  const location = useLocation();
  
  const navItems = [
    { path: '/admin/dashboard', icon: <LayoutDashboard size={20} />, label: '仪表盘' },
    { path: '/admin/employees', icon: <Users size={20} />, label: '员工管理' },
    { path: '/admin/departments', icon: <Settings size={20} />, label: '部门设置' },
    { path: '/admin/salary', icon: <FileText size={20} />, label: '薪资管理' },
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-primary text-white flex flex-col">
        <div className="p-4 text-2xl font-bold flex items-center justify-center border-b border-blue-700">
          <span className="text-white">RuiHR 管理系统</span>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center px-4 py-2 space-x-3 rounded-md transition-colors ${
                location.pathname.startsWith(item.path)
                  ? 'bg-blue-700 text-white'
                  : 'text-blue-100 hover:bg-blue-800'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-blue-700">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-blue-500"></div>
            <div>
              <p className="text-sm font-medium">管理员</p>
              <p className="text-xs text-blue-300">人事经理</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8">
        <Outlet />
      </main>
    </div>
  );
}
