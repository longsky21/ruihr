import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import api from '../../lib/api';
import { User, LogOut, FileText, ChevronRight, UserCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Employee {
  id: number;
  name: string;
  phone: string;
  department_id: number;
  position: string;
  hire_date: string;
}

export default function Profile() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState<Employee | null>(null);

  useEffect(() => {
    const fetchEmployee = async () => {
      try {
        if (!user) return;
        const res = await api.get('/employees');
        // Simple match for demo. Ideally backend provides /employees/me
        const myEmployee = res.data.find((e: any) => e.user_id === user.id);
        if (myEmployee) {
          setEmployee(myEmployee);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchEmployee();
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header / User Info Card */}
      <div className="bg-primary text-white p-6 pt-10 rounded-b-3xl shadow-md">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
            <UserCircle size={40} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold">{employee?.name || user?.username || '员工'}</h1>
            <p className="text-blue-100 text-sm">{employee?.position || '职位未知'}</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4 -mt-4">
        {/* Menu Group 1 */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex justify-between items-center cursor-pointer hover:bg-gray-50 transition-colors">
            <div className="flex items-center space-x-3 text-gray-700">
              <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                <FileText size={20} />
              </div>
              <span className="font-medium">我的工资条</span>
            </div>
            <ChevronRight size={16} className="text-gray-400" />
          </div>
          
          <div className="p-4 flex justify-between items-center cursor-pointer hover:bg-gray-50 transition-colors">
             <div className="flex items-center space-x-3 text-gray-700">
              <div className="p-2 bg-green-50 rounded-lg text-green-600">
                <User size={20} />
              </div>
              <span className="font-medium">个人信息</span>
            </div>
            <ChevronRight size={16} className="text-gray-400" />
          </div>
        </div>

        {/* Info Card */}
        {employee && (
            <div className="bg-white rounded-xl shadow-sm p-4 space-y-3">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">基本信息</h3>
                <div className="flex justify-between py-2 border-b border-gray-50">
                    <span className="text-gray-500">工号</span>
                    <span className="text-gray-800 font-medium">{user?.username}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-50">
                    <span className="text-gray-500">手机号</span>
                    <span className="text-gray-800 font-medium">{employee.phone}</span>
                </div>
                 <div className="flex justify-between py-2">
                    <span className="text-gray-500">入职日期</span>
                    <span className="text-gray-800 font-medium">{employee.hire_date}</span>
                </div>
            </div>
        )}

        {/* Logout Button */}
        <button 
          onClick={handleLogout}
          className="w-full bg-white text-red-500 font-medium p-4 rounded-xl shadow-sm flex items-center justify-center space-x-2 hover:bg-red-50 transition-colors"
        >
          <LogOut size={20} />
          <span>退出登录</span>
        </button>
      </div>
    </div>
  );
}
