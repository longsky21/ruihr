import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Clock, CheckSquare, User } from 'lucide-react';

export default function AppLayout() {
  const location = useLocation();
  
  const navItems = [
    { path: '/app/clock-in', icon: <Clock size={24} />, label: '考勤打卡' },
    { path: '/app/oa', icon: <CheckSquare size={24} />, label: 'OA审批' },
    { path: '/app/profile', icon: <User size={24} />, label: '我的' },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <main className="flex-1 overflow-y-auto pb-16">
        <Outlet />
      </main>
      <nav className="fixed bottom-0 w-full bg-white border-t border-gray-200 shadow-lg">
        <div className="flex justify-around py-3">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center space-y-1 ${
                location.pathname.startsWith(item.path) ? 'text-primary' : 'text-gray-500'
              }`}
            >
              {item.icon}
              <span className="text-xs">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
