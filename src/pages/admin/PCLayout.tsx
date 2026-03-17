import React, { useState } from 'react';
import { Layout, Menu, Breadcrumb, Avatar, Dropdown } from 'antd';
import {
  TeamOutlined,
  UserOutlined,
  ApartmentOutlined,
  CalendarOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';

const { Header, Sider, Content } = Layout;

const PCLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed} theme="light" className="shadow-md z-10">
        <div className="h-16 flex items-center justify-center border-b border-gray-100">
          <h1 className={`font-bold text-xl text-primary transition-all duration-300 ${collapsed ? 'scale-0 w-0' : 'scale-100 w-auto'}`}>
            RuiHR
          </h1>
        </div>
        <Menu
          theme="light"
          mode="inline"
          selectedKeys={[location.pathname]}
          defaultOpenKeys={['attendance']}
          onClick={({ key }) => navigate(key)}
          items={[
            {
              key: '/pc/organization',
              icon: <ApartmentOutlined />,
              label: '组织架构',
            },
            {
              key: '/pc/employees',
              icon: <TeamOutlined />,
              label: '员工管理',
            },
            {
              key: 'attendance',
              icon: <CalendarOutlined />,
              label: '考勤管理',
              children: [
                {
                  key: '/pc/attendance/records',
                  label: '打卡记录',
                },
                {
                  key: '/pc/attendance/report',
                  label: '考勤月报',
                },
                {
                  key: '/pc/attendance/locations',
                  label: '打卡区域',
                },
              ],
            },
          ]}
        />
      </Sider>
      <Layout>
        <Header className="bg-white px-4 flex justify-between items-center shadow-sm">
          {React.createElement(collapsed ? MenuUnfoldOutlined : MenuFoldOutlined, {
            className: 'text-lg cursor-pointer hover:text-primary transition-colors',
            onClick: () => setCollapsed(!collapsed),
          })}
          
          <div className="flex items-center gap-4">
            <span className="text-gray-600">欢迎, {user?.username}</span>
            <Dropdown menu={{
              items: [
                {
                  key: 'logout',
                  icon: <LogoutOutlined />,
                  label: '退出登录',
                  onClick: handleLogout,
                },
              ]
            }} placement="bottomRight">
              <Avatar icon={<UserOutlined />} className="cursor-pointer bg-primary" />
            </Dropdown>
          </div>
        </Header>
        <Content className="m-4 p-6 bg-white rounded-lg shadow-sm overflow-auto">
           <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default PCLayout;
