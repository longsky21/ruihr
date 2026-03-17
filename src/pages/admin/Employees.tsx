import React, { useEffect, useState } from 'react';
import { Table, Button, Input, Space, Tag, message, TreeSelect, DatePicker, Pagination, Modal, Form, Select, Row, Col, Drawer, Popconfirm } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { ImportOutlined, SearchOutlined, ReloadOutlined, UserAddOutlined, ClearOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import api from '../../lib/api';
import dayjs from 'dayjs';

const { Search } = Input;
const { RangePicker } = DatePicker;

interface Employee {
  id: number;
  employee_no: string;
  name: string;
  english_name?: string;
  status: number;
  department_id: number;
  gender?: string;
  birthday?: string;
  id_card_no?: string;
  nationality?: string;
  hukou_type?: string;
  hukou_location?: string;
  native_place?: string;
  marital_status?: string;
  political_status?: string;
  education?: string;
  created_at: string;
  department?: {
      id: number;
      name: string;
  };
  contact?: {
      phone: string;
      email: string;
      work_phone?: string;
      work_email?: string;
      wechat?: string;
      contact_address?: string;
      home_address?: string;
      emergency_contact_name?: string;
      emergency_contact_phone?: string;
  };
  position_info?: {
      position_title: string;
      job_title: string;
      job_level?: string;
      hire_date?: string;
      employment_type?: string;
      contract_company?: string;
      contract_type?: string;
      probation_months?: number;
      probation_end_date?: string;
      probation_status?: string;
      contract_start_date?: string;
      contract_end_date?: string;
      work_location?: string;
  };
}

const Employees: React.FC = () => {
  const [data, setData] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [pagination, setPagination] = useState({ 
    current: 1, 
    pageSize: 10, 
    total: 0,
    showSizeChanger: true,
    pageSizeOptions: ['10', '50', '100'],
    showTotal: (total: number) => `共 ${total} 条`,
  });
  const [deptTree, setDeptTree] = useState([]);
  
  // Search states
  const [selectedDeptId, setSelectedDeptId] = useState<number | undefined>(undefined);
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [searchHireDate, setSearchHireDate] = useState<any>(null);

  // Modal states
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('新增员工');
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  // Detail drawer
  const [detailVisible, setDetailVisible] = useState(false);
  const [detailEmployee, setDetailEmployee] = useState<Employee | null>(null);

  const fetchEmployees = async (params: any = {}) => {
    setLoading(true);
    try {
      const skip = (pagination.current - 1) * pagination.pageSize;
      const limit = pagination.pageSize;
      
      const searchParams = {
        skip,
        limit,
        department_id: selectedDeptId,
        keyword: searchKeyword || undefined,
        hire_date: searchHireDate ? searchHireDate.format('YYYY-MM-DD') : undefined,
        ...params
      };
      
      const res = await api.get('/employees', { params: searchParams });
      setData(res.data);
      
      const countRes = await api.get('/employees/count', { 
          params: {
            department_id: searchParams.department_id,
            keyword: searchParams.keyword,
            hire_date: searchParams.hire_date
          } 
      });
      setPagination(prev => ({ ...prev, total: countRes.data }));
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
  }, [pagination.current, pagination.pageSize]);

  useEffect(() => {
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

  // Handle create new employee
  const handleCreate = () => {
    setEditingEmployee(null);
    setModalTitle('新增员工');
    form.resetFields();
    form.setFieldsValue({ status: 1 });
    setModalVisible(true);
  };

  // Handle edit employee
  const handleEdit = (record: Employee) => {
    setEditingEmployee(record);
    setModalTitle('编辑员工');
    
    const formData = {
      ...record,
      birthday: record.birthday ? dayjs(record.birthday) : null,
      hire_date: record.position_info?.hire_date ? dayjs(record.position_info.hire_date) : null,
      probation_end_date: record.position_info?.probation_end_date ? dayjs(record.position_info.probation_end_date) : null,
      contract_start_date: record.position_info?.contract_start_date ? dayjs(record.position_info.contract_start_date) : null,
      contract_end_date: record.position_info?.contract_end_date ? dayjs(record.position_info.contract_end_date) : null,
      // Contact fields
      phone: record.contact?.phone,
      email: record.contact?.email,
      work_phone: record.contact?.work_phone,
      work_email: record.contact?.work_email,
      wechat: record.contact?.wechat,
      contact_address: record.contact?.contact_address,
      home_address: record.contact?.home_address,
      emergency_contact_name: record.contact?.emergency_contact_name,
      emergency_contact_phone: record.contact?.emergency_contact_phone,
      // Position fields
      position_title: record.position_info?.position_title,
      job_title: record.position_info?.job_title,
      job_level: record.position_info?.job_level,
      employment_type: record.position_info?.employment_type,
      contract_company: record.position_info?.contract_company,
      contract_type: record.position_info?.contract_type,
      probation_months: record.position_info?.probation_months,
      probation_status: record.position_info?.probation_status,
      work_location: record.position_info?.work_location,
    };
    
    form.setFieldsValue(formData);
    setModalVisible(true);
  };

  // Handle view detail
  const handleView = (record: Employee) => {
    setDetailEmployee(record);
    setDetailVisible(true);
  };

  // Handle delete
  const handleDelete = async (record: Employee) => {
    try {
      await api.delete(`/employees/${record.id}`);
      message.success('删除成功');
      fetchEmployees();
    } catch (error: any) {
      message.error(error.response?.data?.detail || '删除失败');
    }
  };

  // Handle submit
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      
      // Format dates
      const payload = {
        ...values,
        birthday: values.birthday ? values.birthday.format('YYYY-MM-DD') : null,
        hire_date: values.hire_date ? values.hire_date.format('YYYY-MM-DD') : null,
        probation_end_date: values.probation_end_date ? values.probation_end_date.format('YYYY-MM-DD') : null,
        contract_start_date: values.contract_start_date ? values.contract_start_date.format('YYYY-MM-DD') : null,
        contract_end_date: values.contract_end_date ? values.contract_end_date.format('YYYY-MM-DD') : null,
      };
      
      if (editingEmployee) {
        // Update
        // Separate contact and position info for update
        const updateData = { ...payload };
        const contactData = {
          phone: payload.phone,
          email: payload.email,
          work_phone: payload.work_phone,
          work_email: payload.work_email,
          wechat: payload.wechat,
          contact_address: payload.contact_address,
          home_address: payload.home_address,
          emergency_contact_name: payload.emergency_contact_name,
          emergency_contact_phone: payload.emergency_contact_phone,
        };
        const positionData = {
          position_title: payload.position_title,
          job_title: payload.job_title,
          job_level: payload.job_level,
          hire_date: payload.hire_date,
          employment_type: payload.employment_type,
          contract_company: payload.contract_company,
          contract_type: payload.contract_type,
          probation_months: payload.probation_months,
          probation_end_date: payload.probation_end_date,
          probation_status: payload.probation_status,
          contract_start_date: payload.contract_start_date,
          contract_end_date: payload.contract_end_date,
          work_location: payload.work_location,
        };
        
        updateData.contact = contactData;
        updateData.position_info = positionData;
        
        // Remove flat fields
        ['phone', 'email', 'work_phone', 'work_email', 'wechat', 'contact_address', 'home_address', 'emergency_contact_name', 'emergency_contact_phone', 'position_title', 'job_title', 'job_level', 'employment_type', 'contract_company', 'contract_type', 'probation_months', 'probation_status', 'work_location'].forEach(k => delete updateData[k]);
        
        await api.put(`/employees/${editingEmployee.id}`, updateData);
        message.success('更新成功');
      } else {
        // Create
        await api.post('/employees', payload);
        message.success('创建成功');
      }
      
      setModalVisible(false);
      fetchEmployees();
    } catch (error: any) {
      message.error(error.response?.data?.detail || '操作失败');
    } finally {
      setSubmitting(false);
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
      dataIndex: ['department', 'name'],
      key: 'department',
      width: 150,
    },
    {
      title: '职位',
      dataIndex: ['position_info', 'position_title'],
      key: 'position',
      width: 120,
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
      render: (status: number) => (
          <Tag color={status === 1 ? 'green' : 'red'}>
              {status === 1 ? '在职' : '离职'}
          </Tag>
      )
    },
    {
      title: '入职日期',
      dataIndex: ['position_info', 'hire_date'],
      key: 'hire_date',
      width: 120,
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleView(record)}>
            查看
          </Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Popconfirm
            title="确定删除该员工吗？"
            description="此操作不可撤销"
            onConfirm={() => handleDelete(record)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="h-full flex flex-col">
       <div className="mb-4 flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">员工管理</h2>
        <div className="space-x-2">
             <Button icon={<ReloadOutlined />} onClick={() => fetchEmployees()}>刷新</Button>
            <Button type="primary" icon={<ImportOutlined />} loading={importing} onClick={handleImport}>
              批量导入
            </Button>
            <Button type="primary" icon={<UserAddOutlined />} onClick={handleCreate}>
              新增员工
            </Button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg border border-gray-100 mb-4">
          <Space wrap>
            <TreeSelect
                treeData={deptTree}
                placeholder="选择部门"
                style={{ width: 300 }}
                allowClear
                treeDefaultExpandAll
                value={selectedDeptId}
                onChange={(value) => setSelectedDeptId(value)}
            />
            <Input 
              placeholder="姓名/工号/手机号" 
              prefix={<SearchOutlined />} 
              style={{ width: 200 }} 
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
            />
            <DatePicker 
              placeholder="入职日期" 
              style={{ width: 150 }}
              value={searchHireDate}
              onChange={(date) => setSearchHireDate(date)}
            />
            <Button icon={<ClearOutlined />} onClick={() => {
              setSelectedDeptId(undefined);
              setSearchKeyword('');
              setSearchHireDate(null);
              setPagination(prev => ({ ...prev, current: 1 }));
              fetchEmployees({ 
                skip: 0, 
                department_id: undefined, 
                keyword: undefined, 
                hire_date: undefined 
              });
            }}>重置</Button>
            <Button type="primary" icon={<SearchOutlined />} onClick={() => {
              setPagination(prev => ({ ...prev, current: 1 }));
              fetchEmployees({ skip: 0 });
            }}>查询</Button>
          </Space>
      </div>

      <div className="flex-1 bg-white rounded-lg border border-gray-100 flex flex-col min-h-0 overflow-hidden">
        <div className="flex-1 overflow-auto">
          <Table 
              columns={columns} 
              dataSource={data} 
              rowKey="id"
              loading={loading}
              pagination={false}
              scroll={{ x: 1200 }}
          />
        </div>
        <div className="p-4 border-t border-gray-100 flex justify-end bg-white flex-shrink-0">
          <Pagination
            {...pagination}
            onChange={(page, pageSize) => {
              setPagination(prev => ({ ...prev, current: page, pageSize }));
            }}
          />
        </div>
      </div>

      {/* Create/Edit Modal */}
      <Modal
        title={modalTitle}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleSubmit}
        confirmLoading={submitting}
        width={900}
        okText="保存"
        cancelText="取消"
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <div className="bg-gray-50 p-3 rounded mb-4">
            <h3 className="font-bold text-gray-700 mb-3">基本信息</h3>
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item label="工号" name="employee_no" rules={[{ required: true, message: '请输入工号' }]}>
                  <Input placeholder="请输入工号" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="姓名" name="name" rules={[{ required: true, message: '请输入姓名' }]}>
                  <Input placeholder="请输入姓名" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="英文名" name="english_name">
                  <Input placeholder="请输入英文名" />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item label="部门" name="department_id">
                  <TreeSelect
                    treeData={deptTree}
                    placeholder="选择部门"
                    allowClear
                    treeDefaultExpandAll
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="状态" name="status">
                  <Select placeholder="选择状态">
                    <Select.Option value={1}>在职</Select.Option>
                    <Select.Option value={0}>离职</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="性别" name="gender">
                  <Select placeholder="选择性别">
                    <Select.Option value="male">男</Select.Option>
                    <Select.Option value="female">女</Select.Option>
                    <Select.Option value="other">其他</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item label="出生日期" name="birthday">
                  <DatePicker style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="身份证号" name="id_card_no">
                  <Input placeholder="请输入身份证号" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="民族" name="nationality">
                  <Input placeholder="请输入民族" />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item label="籍贯" name="native_place">
                  <Input placeholder="请输入籍贯" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="户口类型" name="hukou_type">
                  <Select placeholder="选择户口类型">
                    <Select.Option value="城市">城市</Select.Option>
                    <Select.Option value="农村">农村</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="户口所在地" name="hukou_location">
                  <Input placeholder="请输入户口所在地" />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item label="婚姻状况" name="marital_status">
                  <Select placeholder="选择婚姻状况">
                    <Select.Option value="未婚">未婚</Select.Option>
                    <Select.Option value="已婚">已婚</Select.Option>
                    <Select.Option value="离异">离异</Select.Option>
                    <Select.Option value="丧偶">丧偶</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="政治面貌" name="political_status">
                  <Select placeholder="选择政治面貌">
                    <Select.Option value="群众">群众</Select.Option>
                    <Select.Option value="共青团员">共青团员</Select.Option>
                    <Select.Option value="中共党员">中共党员</Select.Option>
                    <Select.Option value="民主党派">民主党派</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="学历" name="education">
                  <Select placeholder="选择学历">
                    <Select.Option value="初中">初中</Select.Option>
                    <Select.Option value="高中">高中</Select.Option>
                    <Select.Option value="中专">中专</Select.Option>
                    <Select.Option value="大专">大专</Select.Option>
                    <Select.Option value="本科">本科</Select.Option>
                    <Select.Option value="硕士">硕士</Select.Option>
                    <Select.Option value="博士">博士</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
          </div>

          <div className="bg-gray-50 p-3 rounded mb-4">
            <h3 className="font-bold text-gray-700 mb-3">职位信息</h3>
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item label="职位" name="position_title">
                  <Input placeholder="请输入职位" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="职务" name="job_title">
                  <Input placeholder="请输入职务" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="职级" name="job_level">
                  <Input placeholder="请输入职级" />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item label="入职日期" name="hire_date">
                  <DatePicker style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="用工性质" name="employment_type">
                  <Select placeholder="选择用工性质">
                    <Select.Option value="全职">全职</Select.Option>
                    <Select.Option value="兼职">兼职</Select.Option>
                    <Select.Option value="实习">实习</Select.Option>
                    <Select.Option value="劳务派遣">劳务派遣</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="工作地点" name="work_location">
                  <Input placeholder="请输入工作地点" />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item label="合同公司" name="contract_company">
                  <Input placeholder="请输入合同公司" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="合同类型" name="contract_type">
                  <Select placeholder="选择合同类型">
                    <Select.Option value="固定期限">固定期限</Select.Option>
                    <Select.Option value="无固定期限">无固定期限</Select.Option>
                    <Select.Option value="实习">实习</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="试用期(月)" name="probation_months">
                  <Input type="number" placeholder="请输入试用期月数" />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item label="试用期结束日期" name="probation_end_date">
                  <DatePicker style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="试用期状态" name="probation_status">
                  <Select placeholder="选择试用期状态">
                    <Select.Option value="试用期">试用期</Select.Option>
                    <Select.Option value="转正">转正</Select.Option>
                    <Select.Option value="延期">延期</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="合同起始日期" name="contract_start_date">
                  <DatePicker style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item label="合同结束日期" name="contract_end_date">
                  <DatePicker style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>
          </div>

          <div className="bg-gray-50 p-3 rounded">
            <h3 className="font-bold text-gray-700 mb-3">联系方式</h3>
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item label="手机号" name="phone" rules={[{ required: true, message: '请输入手机号' }]}>
                  <Input placeholder="请输入手机号" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="邮箱" name="email">
                  <Input placeholder="请输入邮箱" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="微信号" name="wechat">
                  <Input placeholder="请输入微信号" />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item label="工作电话" name="work_phone">
                  <Input placeholder="请输入工作电话" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="工作邮箱" name="work_email">
                  <Input placeholder="请输入工作邮箱" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="通讯地址" name="contact_address">
                  <Input placeholder="请输入通讯地址" />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item label="家庭住址" name="home_address">
                  <Input placeholder="请输入家庭住址" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="紧急联系人" name="emergency_contact_name">
                  <Input placeholder="请输入紧急联系人" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="紧急联系人电话" name="emergency_contact_phone">
                  <Input placeholder="请输入紧急联系人电话" />
                </Form.Item>
              </Col>
            </Row>
          </div>
        </Form>
      </Modal>

      {/* Detail Drawer */}
      <Drawer
        title="员工详情"
        placement="right"
        width={700}
        onClose={() => setDetailVisible(false)}
        open={detailVisible}
      >
        {detailEmployee && (
          <div>
            <h3 className="font-bold text-xl mb-6 text-center">{detailEmployee.name}</h3>
            
            <div className="mb-6">
              <h4 className="font-semibold text-gray-700 border-b pb-2 mb-3">基本信息</h4>
              <Row gutter={[24, 16]}>
                <Col span={12}><p className="mb-2"><span className="text-gray-500">工号：</span>{detailEmployee.employee_no}</p></Col>
                <Col span={12}><p className="mb-2"><span className="text-gray-500">姓名：</span>{detailEmployee.name}</p></Col>
                <Col span={12}><p className="mb-2"><span className="text-gray-500">英文名：</span>{detailEmployee.english_name || '-'}</p></Col>
                <Col span={12}><p className="mb-2"><span className="text-gray-500">部门：</span>{detailEmployee.department?.name || '-'}</p></Col>
                <Col span={12}><p className="mb-2"><span className="text-gray-500">状态：</span>{detailEmployee.status === 1 ? '在职' : '离职'}</p></Col>
                <Col span={12}><p className="mb-2"><span className="text-gray-500">性别：</span>{detailEmployee.gender || '-'}</p></Col>
                <Col span={12}><p className="mb-2"><span className="text-gray-500">出生日期：</span>{detailEmployee.birthday || '-'}</p></Col>
                <Col span={12}><p className="mb-2"><span className="text-gray-500">身份证号：</span>{detailEmployee.id_card_no || '-'}</p></Col>
                <Col span={12}><p className="mb-2"><span className="text-gray-500">民族：</span>{detailEmployee.nationality || '-'}</p></Col>
                <Col span={12}><p className="mb-2"><span className="text-gray-500">籍贯：</span>{detailEmployee.native_place || '-'}</p></Col>
                <Col span={12}><p className="mb-2"><span className="text-gray-500">户口类型：</span>{detailEmployee.hukou_type || '-'}</p></Col>
                <Col span={12}><p className="mb-2"><span className="text-gray-500">户口所在地：</span>{detailEmployee.hukou_location || '-'}</p></Col>
                <Col span={12}><p className="mb-2"><span className="text-gray-500">婚姻状况：</span>{detailEmployee.marital_status || '-'}</p></Col>
                <Col span={12}><p className="mb-2"><span className="text-gray-500">政治面貌：</span>{detailEmployee.political_status || '-'}</p></Col>
                <Col span={12}><p className="mb-2"><span className="text-gray-500">学历：</span>{detailEmployee.education || '-'}</p></Col>
              </Row>
            </div>

            <div className="mb-6">
              <h4 className="font-semibold text-gray-700 border-b pb-2 mb-3">职位信息</h4>
              <Row gutter={[24, 16]}>
                <Col span={12}><p className="mb-2"><span className="text-gray-500">职位：</span>{detailEmployee.position_info?.position_title || '-'}</p></Col>
                <Col span={12}><p className="mb-2"><span className="text-gray-500">职务：</span>{detailEmployee.position_info?.job_title || '-'}</p></Col>
                <Col span={12}><p className="mb-2"><span className="text-gray-500">职级：</span>{detailEmployee.position_info?.job_level || '-'}</p></Col>
                <Col span={12}><p className="mb-2"><span className="text-gray-500">入职日期：</span>{detailEmployee.position_info?.hire_date || '-'}</p></Col>
                <Col span={12}><p className="mb-2"><span className="text-gray-500">用工性质：</span>{detailEmployee.position_info?.employment_type || '-'}</p></Col>
                <Col span={12}><p className="mb-2"><span className="text-gray-500">工作地点：</span>{detailEmployee.position_info?.work_location || '-'}</p></Col>
                <Col span={12}><p className="mb-2"><span className="text-gray-500">合同公司：</span>{detailEmployee.position_info?.contract_company || '-'}</p></Col>
                <Col span={12}><p className="mb-2"><span className="text-gray-500">合同类型：</span>{detailEmployee.position_info?.contract_type || '-'}</p></Col>
                <Col span={12}><p className="mb-2"><span className="text-gray-500">试用期：</span>{detailEmployee.position_info?.probation_months ? `${detailEmployee.position_info.probation_months}个月` : '-'}</p></Col>
                <Col span={12}><p className="mb-2"><span className="text-gray-500">试用期状态：</span>{detailEmployee.position_info?.probation_status || '-'}</p></Col>
                <Col span={12}><p className="mb-2"><span className="text-gray-500">合同开始：</span>{detailEmployee.position_info?.contract_start_date || '-'}</p></Col>
                <Col span={12}><p className="mb-2"><span className="text-gray-500">合同结束：</span>{detailEmployee.position_info?.contract_end_date || '-'}</p></Col>
              </Row>
            </div>

            <div>
              <h4 className="font-semibold text-gray-700 border-b pb-2 mb-3">联系方式</h4>
              <Row gutter={[24, 16]}>
                <Col span={12}><p className="mb-2"><span className="text-gray-500">手机号：</span>{detailEmployee.contact?.phone || '-'}</p></Col>
                <Col span={12}><p className="mb-2"><span className="text-gray-500">邮箱：</span>{detailEmployee.contact?.email || '-'}</p></Col>
                <Col span={12}><p className="mb-2"><span className="text-gray-500">微信号：</span>{detailEmployee.contact?.wechat || '-'}</p></Col>
                <Col span={12}><p className="mb-2"><span className="text-gray-500">工作电话：</span>{detailEmployee.contact?.work_phone || '-'}</p></Col>
                <Col span={12}><p className="mb-2"><span className="text-gray-500">工作邮箱：</span>{detailEmployee.contact?.work_email || '-'}</p></Col>
                <Col span={12}><p className="mb-2"><span className="text-gray-500">通讯地址：</span>{detailEmployee.contact?.contact_address || '-'}</p></Col>
                <Col span={12}><p className="mb-2"><span className="text-gray-500">家庭住址：</span>{detailEmployee.contact?.home_address || '-'}</p></Col>
                <Col span={12}><p className="mb-2"><span className="text-gray-500">紧急联系人：</span>{detailEmployee.contact?.emergency_contact_name || '-'}</p></Col>
                <Col span={12}><p className="mb-2"><span className="text-gray-500">紧急联系人电话：</span>{detailEmployee.contact?.emergency_contact_phone || '-'}</p></Col>
              </Row>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default Employees;