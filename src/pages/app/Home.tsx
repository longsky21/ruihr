import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, Briefcase, Calendar } from 'lucide-react';

export default function Home() {
  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">你好, 员工</h1>
        <p className="text-gray-500">欢迎使用 RuiHR</p>
      </header>

      <div className="grid grid-cols-2 gap-4">
        <Link
          to="/app/clock-in"
          className="flex flex-col items-center justify-center p-6 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="p-3 bg-blue-100 rounded-full text-blue-600 mb-2">
            <Clock size={24} />
          </div>
          <span className="font-medium text-gray-700">打卡</span>
        </Link>
        <Link
          to="/app/leave"
          className="flex flex-col items-center justify-center p-6 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="p-3 bg-green-100 rounded-full text-green-600 mb-2">
            <Briefcase size={24} />
          </div>
          <span className="font-medium text-gray-700">请假</span>
        </Link>
        <Link
          to="/app/salary"
          className="flex flex-col items-center justify-center p-6 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="p-3 bg-yellow-100 rounded-full text-yellow-600 mb-2">
            <Calendar size={24} />
          </div>
          <span className="font-medium text-gray-700">工资条</span>
        </Link>
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">最近动态</h2>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center p-3 bg-white rounded-md shadow-sm">
              <div className="w-2 h-2 rounded-full bg-blue-500 mr-3"></div>
              <div>
                <p className="text-sm font-medium text-gray-800">已打卡</p>
                <p className="text-xs text-gray-500">今天, 09:00 AM</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
