import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import api from '../../lib/api';
import { LogOut, FileText, Building, Briefcase, Phone, Calendar, UserCircle, CreditCard, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Employee {
  id: number;
  name: string;
  employee_no: string;
  phone: string;
  email: string;
  department_id: number;
  department: {
    id: number;
    name: string;
  };
  position: string;
  position_title?: string;
  hire_date?: string;
  status: number;
}

export default function Profile() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedSection, setExpandedSection] = useState<'info' | 'salary'>('info');

  useEffect(() => {
    const fetchEmployee = async () => {
      try {
        setLoading(true);
        const res = await api.get('/users/me');
        if (res.data) {
          setEmployee(res.data);
        }
      } catch (err) {
        console.error('获取个人信息失败', err);
      } finally {
        setLoading(false);
      }
    };
    fetchEmployee();
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleSection = (section: 'info' | 'salary') => {
    setExpandedSection(section);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-primary text-white px-4 pt-14 pb-14">
        <div className="flex items-center space-x-4">
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
            <UserCircle size={48} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold mb-2">{employee?.name || user?.username || '员工'}</h1>
            {employee?.department && (
              <p className="text-blue-100 text-sm">{employee.department.name}</p>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 -mt-4 space-y-4">
        {/* 基本信息 可折叠 */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div
            onClick={() => toggleSection('info')}
            className="p-4 flex justify-between items-center cursor-pointer hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center space-x-3 text-gray-700">
              <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                <UserCircle size={20} />
              </div>
              <span className="font-medium">基本信息</span>
            </div>
            <ChevronRight
              size={16}
              className={cn(
                "text-gray-400 transition-transform",
                expandedSection === 'info' ? "transform rotate-90" : ""
              )}
            />
          </div>
          {expandedSection === 'info' && (
            <div className="p-5 border-t border-gray-100">
              <div className="space-y-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center mr-4">
                    <CreditCard size={20} className="text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <span className="text-sm text-gray-500 block">工号</span>
                    <span className="text-base font-medium text-gray-800">{employee?.employee_no || user?.username || '-'}</span>
                  </div>
                </div>

                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center mr-4">
                    <Building size={20} className="text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <span className="text-sm text-gray-500 block">部门</span>
                    <span className="text-base font-medium text-gray-800">{employee?.department?.name || '-'}</span>
                  </div>
                </div>

                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center mr-4">
                    <Briefcase size={20} className="text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <span className="text-sm text-gray-500 block">职位</span>
                    <span className="text-base font-medium text-gray-800">{employee?.position_title || employee?.position || '-'}</span>
                  </div>
                </div>

                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center mr-4">
                    <Phone size={20} className="text-green-600" />
                  </div>
                  <div className="flex-1">
                    <span className="text-sm text-gray-500 block">手机号</span>
                    <span className="text-base font-medium text-gray-800">{employee?.phone || '-'}</span>
                  </div>
                </div>

                {employee?.email && (
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-lg bg-cyan-50 flex items-center justify-center mr-4">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-cyan-600">
                        <rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.5 5.5a2 2 0 0 1-3 0L2 7"/>
                      </svg>
                    </div>
                    <div className="flex-1">
                      <span className="text-sm text-gray-500 block">邮箱</span>
                      <span className="text-base font-medium text-gray-800">{employee.email}</span>
                    </div>
                  </div>
                )}

                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center mr-4">
                    <Calendar size={20} className="text-red-600" />
                  </div>
                  <div className="flex-1">
                    <span className="text-sm text-gray-500 block">入职日期</span>
                    <span className="text-base font-medium text-gray-800">{employee?.hire_date || '-'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 我的工资条 可折叠 */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div
            onClick={() => toggleSection('salary')}
            className="p-4 flex justify-between items-center cursor-pointer hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center space-x-3 text-gray-700">
              <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                <FileText size={20} />
              </div>
              <span className="font-medium">我的工资条</span>
            </div>
            <ChevronRight
              size={16}
              className={cn(
                "text-gray-400 transition-transform",
                expandedSection === 'salary' ? "transform rotate-90" : ""
              )}
            />
          </div>
          {expandedSection === 'salary' && (
            <div className="p-5 border-t border-gray-100 min-h-[200px] flex items-center justify-center text-gray-400">
              <p>敬请期待...</p>
            </div>
          )}
        </div>

        {/* 退出登录按钮 */}
        <button
          onClick={handleLogout}
          className="w-full bg-white text-red-500 font-medium p-4 rounded-2xl shadow-sm flex items-center justify-center space-x-2 hover:bg-red-50 transition-colors"
        >
          <LogOut size={20} />
          <span>退出登录</span>
        </button>
      </div>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
