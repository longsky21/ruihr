import React, { useState, useEffect } from 'react';
import { Table, DatePicker, Select, Input, Button, Spin, message, Breadcrumb } from 'antd';
import { SearchOutlined, DownloadOutlined } from '@ant-design/icons';
import api from '../../../lib/api';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { Option } = Select;

interface AttendanceRecord {
  id: number;
  employee_id: number;
  punch_time: string;
  location: string;
  source: string;
  source_description: string;
  is_valid: boolean;
  device_id: string;
  device_name: string;
  wifi_name: string;
  created_at: string;
  employee?: {
    id: number;
    name: string;
    employee_no: string;
  };
}

const Records: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<AttendanceRecord[]>([]);
  const [employees, setEmployees] = useState<Array<{ id: number; name: string; employee_no: string }>>([]);
  const [filters, setFilters] = useState({
    employee_id: undefined as number | undefined,
    dateRange: null as any,
    keyword: '',
  });

  const fetchEmployees = async () => {
    try {
      const response = await api.get('/employees/');
      setEmployees(response.data);
    } catch (error) {
      message.error('获取员工列表失败');
    }
  };

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (filters.employee_id) {
        params.employee_id = filters.employee_id;
      }
      if (filters.dateRange && filters.dateRange[0] && filters.dateRange[1]) {
        params.start_date = filters.dateRange[0].format('YYYY-MM-DD');
        params.end_date = filters.dateRange[1].format('YYYY-MM-DD');
      }
      if (filters.keyword) {
        params.keyword = filters.keyword;
      }

      const response = await api.get('/attendance/records', { params });
      setData(response.data);
    } catch (error) {
      console.error(error);
      message.error('获取打卡记录失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
    fetchRecords();
  }, []);

  const columns = [
    {
      title: '员工',
      dataIndex: 'employee',
      key: 'employee',
      render: (employee: any) => (
        <div>
          <div>{employee?.name}</div>
          <div className="text-xs text-gray-500">{employee?.employee_no}</div>
        </div>
      ),
    },
    {
      title: '打卡时间',
      dataIndex: 'punch_time',
      key: 'punch_time',
      sorter: (a: AttendanceRecord, b: AttendanceRecord) => 
        new Date(a.punch_time).getTime() - new Date(b.punch_time).getTime(),
    },
    {
      title: '位置',
      dataIndex: 'location',
      key: 'location',
    },
    {
      title: '来源',
      dataIndex: 'source',
      key: 'source',
    },
    {
      title: '状态',
      dataIndex: 'is_valid',
      key: 'is_valid',
      render: (isValid: boolean) => (
        <span className={isValid ? 'text-green-500' : 'text-red-500'}>
          {isValid ? '有效' : '无效'}
        </span>
      ),
    },
    {
      title: '设备',
      dataIndex: 'device_name',
      key: 'device_name',
    },
  ];

  return (
    <div className="p-4">
      <Breadcrumb
        items={[
          { title: '考勤管理' },
          { title: '打卡记录' },
        ]}
        className="mb-4 font-bold text-lg"
      />

      <div className="mb-4 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap gap-2">
          <Select
            placeholder="选择员工"
            style={{ width: 200 }}
            allowClear
            value={filters.employee_id}
            onChange={(value) => setFilters({ ...filters, employee_id: value })}
          >
            {employees.map((employee) => (
              <Option key={employee.id} value={employee.id}>
                {employee.name} ({employee.employee_no})
              </Option>
            ))}
          </Select>
          <RangePicker
            placeholder={['开始日期', '结束日期']}
            style={{ width: 300 }}
            value={filters.dateRange}
            onChange={(dates) => setFilters({ ...filters, dateRange: dates })}
          />
          <Input
            placeholder="搜索关键字"
            prefix={<SearchOutlined />}
            style={{ width: 200 }}
            value={filters.keyword}
            onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
          />
        </div>
        <div className="flex gap-2">
          <Button type="primary" onClick={fetchRecords}>
            查询
          </Button>
          <Button
            icon={<DownloadOutlined />}
            onClick={() => {
              message.info('导出功能开发中');
            }}
          >
            导出
          </Button>
        </div>
      </div>

      <Spin spinning={loading}>
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          pagination={{
            defaultPageSize: 10,
            pageSizeOptions: ['10', '50', '100'],
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`,
          }}
          scroll={{ x: 1000 }}
        />
      </Spin>
    </div>
  );
};

export default Records;