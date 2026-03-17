import React, { useState, useEffect } from 'react';
import { Table, DatePicker, Select, Button, Spin, message, Breadcrumb } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import api from '../../../lib/api';
import dayjs from 'dayjs';

const { Option } = Select;

interface AttendanceReport {
  employee_id: number;
  employee_name: string;
  employee_no: string;
  department_name: string;
  total_days: number;
  normal_days: number;
  late_days: number;
  absent_days: number;
  overtime_hours: number;
  leave_days: number;
}

const Report: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<AttendanceReport[]>([]);
  const [departments, setDepartments] = useState<Array<{ id: number; name: string }>>([]);
  const [month, setMonth] = useState<string>(new Date().toISOString().slice(0, 7));
  const [departmentId, setDepartmentId] = useState<number | undefined>();

  const fetchDepartments = async () => {
    try {
      const response = await api.get('/departments/');
      setDepartments(response.data);
    } catch (error) {
      message.error('获取部门列表失败');
    }
  };

  const fetchReport = async () => {
    setLoading(true);
    try {
      const params: any = { month };
      if (departmentId) {
        params.department_id = departmentId;
      }

      const response = await api.get('/attendance/report', { params });
      setData(response.data);
    } catch (error) {
      console.error(error);
      message.error('获取考勤报表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    fetchReport();
  }, [month, departmentId]);

  const columns = [
    {
      title: '员工姓名',
      dataIndex: 'employee_name',
      key: 'employee_name',
    },
    {
      title: '工号',
      dataIndex: 'employee_no',
      key: 'employee_no',
    },
    {
      title: '部门',
      dataIndex: 'department_name',
      key: 'department_name',
    },
    {
      title: '应出勤天数',
      dataIndex: 'total_days',
      key: 'total_days',
    },
    {
      title: '正常出勤',
      dataIndex: 'normal_days',
      key: 'normal_days',
    },
    {
      title: '迟到',
      dataIndex: 'late_days',
      key: 'late_days',
    },
    {
      title: '缺勤',
      dataIndex: 'absent_days',
      key: 'absent_days',
    },
    {
      title: '加班小时',
      dataIndex: 'overtime_hours',
      key: 'overtime_hours',
    },
    {
      title: '请假天数',
      dataIndex: 'leave_days',
      key: 'leave_days',
    },
  ];

  const handleExport = () => {
    message.info('导出功能开发中');
  };

  return (
    <div className="p-4">
      <Breadcrumb
        items={[
          { title: '考勤管理' },
          { title: '考勤月报' },
        ]}
        className="mb-4 font-bold text-lg"
      />
      <div className="mb-4 flex flex-wrap gap-2 items-center justify-between">
        <div className="flex flex-wrap gap-2">
          <DatePicker
            picker="month"
            defaultValue={dayjs(month)}
            onChange={(date, dateString) => setMonth(typeof dateString === 'string' ? dateString : dateString[0])}
            allowClear={false}
            style={{ width: 200 }}
          />
          <Select
            placeholder="选择部门"
            style={{ width: 200 }}
            allowClear
            value={departmentId}
            onChange={(value) => setDepartmentId(value)}
          >
            {departments.map((dept) => (
              <Option key={dept.id} value={dept.id}>{dept.name}</Option>
            ))}
          </Select>
        </div>
        <Button
          type="primary"
          icon={<DownloadOutlined />}
          onClick={handleExport}
        >
          导出报表
        </Button>
      </div>

      <Spin spinning={loading}>
        <Table
          columns={columns}
          dataSource={data}
          rowKey="employee_id"
          pagination={{
            defaultPageSize: 10,
            pageSizeOptions: ['10', '50', '100'],
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`,
          }}
          scroll={{ x: 1200 }}
        />
      </Spin>
    </div>
  );
};

export default Report;