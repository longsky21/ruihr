import React from 'react';
import { Layout, Menu, Breadcrumb } from 'antd';
import { Outlet, useNavigate } from 'react-router-dom';

const { Content, Sider } = Layout;

const AttendanceLayout: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Layout style={{ minHeight: 'calc(100vh - 80px)' }}>
      <Sider width={200} style={{ background: '#f8f9fa' }}>
        <Menu
          mode="inline"
          selectedKeys={[window.location.pathname]}
          onClick={({ key }) => navigate(key)}
          items={[
            {
              key: '/pc/attendance/records',
              label: '打卡记录',
            },
            {
              key: '/pc/attendance/report',
              label: '考勤月报',
            },
          ]}
        />
      </Sider>
      <Content style={{ padding: '0 24px', margin: 0, minHeight: 280 }}>
        <Breadcrumb style={{ margin: '16px 0' }}>
          <Breadcrumb.Item>考勤管理</Breadcrumb.Item>
        </Breadcrumb>
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <Outlet />
        </div>
      </Content>
    </Layout>
  );
};

export default AttendanceLayout;