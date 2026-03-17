import React, { useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import api from '../../lib/api';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('username', username);
      formData.append('password', password);
      
      const res = await api.post('/token', formData);
      const token = res.data.access_token;
      
      // Get user info
      const userRes = await api.get('/users/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const user = userRes.data;
      login(token, user);
      
      // Redirect to admin dashboard
      navigate('/admin');
    } catch (err) {
      setError('用户名或密码错误');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* 左侧品牌区域 */}
      <div className="hidden md:flex flex-1 bg-[linear-gradient(135deg,#001f3f,#0074D9)] flex-col justify-center items-center text-white p-8 relative overflow-hidden">
        {/* 条纹背景 */}
        <div className="absolute inset-0 z-0" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 20px, rgba(255,255,255,0.02) 20px, rgba(255,255,255,0.02) 40px)' }}></div>
        
        {/* Banner 背景图 */}
        <div className="absolute inset-0 z-0 opacity-10 mix-blend-overlay">
          <img src="/banner-ruihe.png" alt="Background" className="w-full h-full object-cover" />
        </div>

        {/* 随机光晕效果 */}
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-white/10 rounded-full blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-[#0074D9]/30 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-[20%] right-[10%] w-64 h-64 bg-cyan-400/10 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-[30%] left-[10%] w-72 h-72 bg-blue-300/10 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: '3s' }}></div>
        
        {/* 内容区域 */}
        <div className="relative z-10 text-center">
          <div className="mb-8 relative inline-block">
            {/* 装饰性图标 - 放置在上层与文字交叉 */}
            <div className="absolute -top-32 -left-28 z-20 pointer-events-none opacity-80 mix-blend-overlay">
               <img src="/banner-ruihe.png" alt="Icon" className="w-auto h-auto max-w-[600px]" />
            </div>

            <h1 className="text-7xl font-black tracking-tighter relative z-10" style={{ fontFamily: 'Georgia, serif', textShadow: '2px 2px 4px rgba(0,0,0,0.3)' }}>
              RuiHR
            </h1>
            <div className="absolute -bottom-2 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/50 to-transparent"></div>
          </div>
          
          <h2 className="text-2xl font-light tracking-[0.2em] mb-4 uppercase text-blue-100">
            Smart HR System
          </h2>
          
          <p className="text-lg text-white/80 font-light tracking-wide mt-8 border-t border-white/10 pt-8 max-w-md mx-auto leading-relaxed">
            智能人力资源管理系统<br/>
            <span className="text-sm text-white/60 mt-2 block">高效管理 · 轻松办公 · 数据驱动</span>
          </p>
        </div>
      </div>
      
      {/* 右侧登录表单 */}
      <div className="w-full md:w-1/2 flex flex-col justify-center p-8">
        <div className="max-w-md w-full mx-auto">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800">登录</h2>
          </div>
          
          {error && (
            <div className="mb-6 p-3 bg-red-50 text-red-500 text-sm rounded-lg flex items-center">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">账号</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all"
                placeholder="请输入账号"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">密码</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all"
                placeholder="请输入密码"
                required
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-gradient-to-r from-[#001f3f] to-[#0074D9] text-white rounded-lg font-medium hover:opacity-90 focus:outline-none focus:ring-4 focus:ring-blue-200 transition-all shadow-md active:scale-95 flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  登录中...
                </>
              ) : (
                '登录'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}