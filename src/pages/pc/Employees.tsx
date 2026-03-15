import React, { useEffect, useState } from 'react';
import { Table, Button, Input, Space, Tag, message, TreeSelect, DatePicker } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { ImportOutlined, SearchOutlined, ReloadOutlined, UserAddOutlined } from '@ant-design/icons';
import api from '../../lib/api';

const { Search } = Input;
const { RangePicker } = DatePicker;

interface Employee {
  id: number;
  employee_no: string;
  name: string;
  status: string;
  department_id: number;
  gender: string;
  created_at: string;
  department?: {
      name: string;
  };
  contact?: {
      phone: string;
      email: string;
  };
  position_info?: {
      position_title: string;
      job_title: string;
  };
}

const Employees: React.FC = () => {
  const [data, setData] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [deptTree, setDeptTree] = useState([]);

  const fetchEmployees = async (params: any = {}) => {
    setLoading(true);
    try {
      // Currently API returns all, we simulate pagination locally or update API
      // Updating API to support pagination is better but for now let's just fetch all
      const res = await api.get('/employees');
      setData(res.data);
      setPagination({ ...pagination, total: res.data.length });
    } catch (error) {
      message.error('获取员工列表失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchDepts = async () => {
      try {
          const res = await api.get('/departments/tree');
          setDeptTree(res.data);
      } catch (e) {}
  };

  useEffect(() => {
    fetchEmployees();
    fetchDepts();
  }, []);

  const handleImport = async () => {
    setImporting(true);
    try {
      const res = await api.post('/admin/import/employees');
      message.success(res.data.message);
      fetchEmployees();
    } catch (error) {
      message.error('导入失败');
    } finally {
      setImporting(false);
    }
  };

  const columns: ColumnsType<Employee> = [
    {
      title: '工号',
      dataIndex: 'employee_no',
      key: 'employee_no',
      width: 100,
    },
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      width: 100,
    },
    {
      title: '部门',
      dataIndex: ['department', 'name'], // Nested path
      key: 'department',
      width: 150,
    },
    {
      title: '职位',
      dataIndex: ['position_info', 'position_title'],
      key: 'position',
      width: 150,
    },
    {
      title: '手机号',
      dataIndex: ['contact', 'phone'],
      key: 'phone',
      width: 120,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status) => (
          <Tag color={status === '在职' || status === 'active' ? 'green' : 'red'}>
              {status === 'active' ? '在职' : status}
          </Tag>
      )
    },
    {
      title: '入职日期',
      dataIndex: 'created_at', // Should be hire_date from position_info
      key: 'hire_date',
      width: 120,
      render: (_, record) => (
          <span>{record.position_info?.hire_date || '-'}</span>
      )
    },
  ];

  return (
    <div className="h-full flex flex-col">
       <div className="mb-4 flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">员工管理</h2>
        <div className="space-x-2">
             <Button icon={<ReloadOutlined />} onClick={() => fetchEmployees()}>刷新</Button>
            <Button type="primary" icon={<ImportOutlined />} loading={importing} onClick={handleImport}>
            导入员工数据
            </Button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg border border-gray-100 mb-4">
          <Space wrap>
            <Input placeholder="姓名/工号/手机号" prefix={<SearchOutlined />} style={{ width: 200 }} />
            <TreeSelect
                treeData={deptTree}
                placeholder="选择部门"
                style={{ width: 200 }}
                allowClear
                treeDefaultExpandAll
            />
            <RangePicker placeholder={['入职开始', '入职结束']} />
            <Button type="primary" icon={<SearchOutlined />}>查询</Button>
          </Space>
      </div>

      <div className="flex-1 bg-white rounded-lg border border-gray-100 overflow-hidden">
        <Table 
            columns={columns} 
            dataSource={data} 
            rowKey="id"
            loading={loading}
            pagination={pagination}
            scroll={{ y: 'calc(100vh - 300px)' }}
        />
      </div>
    </div>
  );
};

export default Employees;
