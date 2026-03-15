import React, { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import api from '../lib/api';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      
      // Redirect based on username or role
      if (user.username === 'admin') {
        // Prevent admin from logging in here if desired, or just redirect
        navigate('/admin/dashboard');
      } else {
        navigate('/app/clock-in');
      }
    } catch (err) {
      setError('用户名或密码错误');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md p-6 bg-white rounded-xl shadow-lg m-4">
        <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-primary mb-2">欢迎回来</h1>
            <p className="text-gray-500 text-sm">RuiHR 员工移动端</p>
        </div>
        
        {error && <div className="mb-4 p-3 bg-red-50 text-red-500 text-sm rounded-lg text-center">{error}</div>}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">账号 / 手机号</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              placeholder="请输入您的账号"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              placeholder="请输入您的密码"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full py-3 text-white bg-primary rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200 transition-all shadow-md active:scale-95"
          >
            立即登录
          </button>
        </form>
        
        <div className="mt-6 text-center text-sm text-gray-400">
            忘记密码请联系人事管理员
        </div>
      </div>
    </div>
  );
}
