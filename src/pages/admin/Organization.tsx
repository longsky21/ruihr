import React, { useEffect, useState } from 'react';
import { Tree, Button, Input, Drawer, Descriptions, Tag, message, Spin, Empty, Form, Select, DatePicker, Space, Modal, Breadcrumb } from 'antd';
import { ImportOutlined, ReloadOutlined, EditOutlined, SaveOutlined, CloseOutlined, PlusOutlined, DeleteOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import api from '../../lib/api';
import dayjs from 'dayjs';

const { Search } = Input;

interface Department {
  id: number;
  key: number;
  title: string;
  name: string;
  code: string;
  manager_name: string;
  level: number;
  children: Department[];
  description?: string;
  status?: string;
  category?: string;
  established_date?: string;
  location?: number; // Office Location ID
  office_location?: { name: string }; // Expanded Office Location
}

const Organization: React.FC = () => {
  const [treeData, setTreeData] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [officeLocations, setOfficeLocations] = useState<{id: number, name: string}[]>([]); // Store locations for select
  const [importing, setImporting] = useState(false);
  const [selectedDept, setSelectedDept] = useState<Department | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [creating, setCreating] = useState(false);
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([]);
  const [autoExpandParent, setAutoExpandParent] = useState(true);
  const [form] = Form.useForm();
  const [createForm] = Form.useForm();

  const getKeysByLevel = (data: Department[], currentLevel: number = 1, maxLevel: number = 3): number[] => {
    let keys: number[] = [];
    data.forEach(item => {
      if (currentLevel < maxLevel) {
        keys.push(item.key);
        if (item.children) {
          keys = keys.concat(getKeysByLevel(item.children, currentLevel + 1, maxLevel));
        }
      }
    });
    return keys;
  };

  const fetchTree = async () => {
    setLoading(true);
    try {
      const res = await api.get('/departments/tree');
      setTreeData(res.data);
      // Auto expand up to level 3
      if (res.data.length > 0) {
          setExpandedKeys(getKeysByLevel(res.data));
      }
    } catch (error) {
      message.error('获取组织架构失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchLocations = async () => {
    try {
      const res = await api.get('/office-locations/');
      setOfficeLocations(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchTree();
    fetchLocations();
  }, []);

  const handleImport = async () => {
    setImporting(true);
    try {
      const res = await api.post('/admin/import/departments');
      message.success(res.data.message);
      fetchTree();
    } catch (error) {
      message.error('导入失败');
    } finally {
      setImporting(false);
    }
  };

  const onSelect = (selectedKeys: React.Key[], info: any) => {
    if (info.node) {
      setSelectedDept(info.node as Department);
      setIsEditing(false);
      setDrawerVisible(true);
    }
  };

  const handleEdit = () => {
    if (selectedDept) {
      form.setFieldsValue({
        ...selectedDept,
        established_date: selectedDept.established_date ? dayjs(selectedDept.established_date) : null,
      });
      setIsEditing(true);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    form.resetFields();
  };

  const handleUpdate = async () => {
    try {
      const values = await form.validateFields();
      setUpdating(true);
      
      const payload = {
        ...values,
        established_date: values.established_date ? values.established_date.format('YYYY-MM-DD') : null,
      };
      
      const res = await api.put(`/departments/${selectedDept?.id}`, payload);
      message.success('更新成功');
      
      // Update selectedDept with new data
      setSelectedDept({
        ...selectedDept!,
        ...res.data,
        key: res.data.id,
        title: res.data.name,
      });
      
      setIsEditing(false);
      fetchTree(); // Refresh tree to reflect changes (e.g. name change)
    } catch (error: any) {
      message.error(error.response?.data?.detail || '更新失败');
    } finally {
      setUpdating(false);
    }
  };

  const handleCreateSubDept = async () => {
    try {
      const values = await createForm.validateFields();
      setCreating(true);
      
      const payload = {
        name: values.name,
        parent_id: selectedDept?.id,
        code: values.code || null,
        manager_name: values.manager_name || null,
        category: values.category || null,
        status: values.status || 'active',
        established_date: values.established_date ? values.established_date.format('YYYY-MM-DD') : null,
        description: values.description || null,
      };
      
      await api.post('/departments', payload);
      message.success('新建子部门成功');
      
      setIsCreateModalVisible(false);
      createForm.resetFields();
      fetchTree(); // Refresh tree
    } catch (error: any) {
      message.error(error.response?.data?.detail || '新建失败');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = () => {
    if (!selectedDept) return;

    const hasChildren = selectedDept.children && selectedDept.children.length > 0;
    
    Modal.confirm({
      title: '确认删除部门?',
      icon: <ExclamationCircleOutlined />,
      content: hasChildren 
        ? `部门 "${selectedDept.name}" 包含子部门。删除该部门可能会导致其子部门也无法正常显示或操作，系统将阻止删除非空部门。确定要尝试删除吗？`
        : `确定要删除部门 "${selectedDept.name}" 吗？此操作不可撤销。`,
      okText: '确认删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await api.delete(`/departments/${selectedDept.id}`);
          message.success('部门已成功删除');
          setDrawerVisible(false);
          setSelectedDept(null);
          fetchTree();
        } catch (error: any) {
          message.error(error.response?.data?.detail || '删除失败，请先移动或删除该部门下的员工及子部门');
        }
      },
    });
  };

  const onExpand = (newExpandedKeys: React.Key[]) => {
    setExpandedKeys(newExpandedKeys);
    setAutoExpandParent(false);
  };

  const onDrop = async (info: any) => {
    const dropKey = info.node.key as number;
    const dragKey = info.dragNode.key as number;

    let newParentId: number | null = null;

    if (!info.dropToGap) {
        // Drop on the content -> become child
        newParentId = dropKey;
    } else {
        // Drop into gap -> become sibling
        // Helper to find parent of a node
        const findParent = (data: Department[], key: number, parent: Department | null = null): Department | null | undefined => {
            for (const item of data) {
                if (item.key === key) {
                    return parent;
                }
                if (item.children) {
                    const res = findParent(item.children, key, item);
                    if (res !== undefined) return res;
                }
            }
            return undefined;
        };

        const parent = findParent(treeData, dropKey);
        newParentId = parent ? parent.key : null;
    }

    try {
        await api.put(`/departments/${dragKey}/move`, { new_parent_id: newParentId });
        message.success('移动成功');
        fetchTree();
    } catch (error: any) {
        message.error(error.response?.data?.detail || '移动失败');
    }
  };

  return (
    <div className="h-full flex flex-col p-4">
      <Breadcrumb
        items={[
          { title: '组织架构' },
        ]}
        className="mb-4 font-bold text-lg"
      />
      <div className="mb-4 flex justify-end space-x-2">
            <Button icon={<ReloadOutlined />} onClick={fetchTree}>刷新</Button>
            <Button type="primary" icon={<ImportOutlined />} loading={importing} onClick={handleImport}>
            导入
            </Button>
      </div>

      <div className="flex-1 bg-white rounded-lg border border-gray-100 flex overflow-hidden">
        <div className="w-1/3 border-r border-gray-100 p-4 flex flex-col">
          <Search style={{ marginBottom: 8 }} placeholder="搜索部门" />
          <div className="flex-1 overflow-auto">
            {loading ? (
                <div className="flex justify-center items-center h-full"><Spin /></div>
            ) : treeData.length > 0 ? (
                <Tree
                    onSelect={onSelect}
                    onExpand={onExpand}
                    expandedKeys={expandedKeys}
                    autoExpandParent={autoExpandParent}
                    treeData={treeData}
                    showLine
                    defaultExpandAll
                    draggable
                    onDrop={onDrop}
                />
            ) : (
                <Empty description="暂无数据，请导入" />
            )}
          </div>
        </div>
        
        <div className="flex-1 p-8 flex flex-col items-center justify-center text-gray-400">
            {selectedDept ? (
                <div className="w-full h-full p-4">
                     {/* Placeholder if we want to show details here instead of Drawer */}
                     <div className="text-center mt-20">请在右侧查看详情</div>
                </div>
            ) : (
                <>
                    <ApartmentOutlined style={{ fontSize: 64, marginBottom: 16, opacity: 0.2 }} />
                    <p>请选择左侧部门查看详情</p>
                </>
            )}
        </div>
      </div>

      <Drawer
        title={isEditing ? "编辑部门" : "部门详情"}
        placement="right"
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        width={500}
        extra={
          <Space>
            {isEditing ? (
              <>
                <Button onClick={handleCancel} icon={<CloseOutlined />}>取消</Button>
                <Button type="primary" onClick={handleUpdate} loading={updating} icon={<SaveOutlined />}>
                  保存
                </Button>
              </>
            ) : (
              <Space>
                <Button icon={<PlusOutlined />} onClick={() => setIsCreateModalVisible(true)}>
                  新建子部门
                </Button>
                <Button type="primary" icon={<EditOutlined />} onClick={handleEdit}>
                  编辑
                </Button>
              </Space>
            )}
          </Space>
        }
      >
        {selectedDept && (
          isEditing ? (
            <Form form={form} layout="vertical">
              <Form.Item label="部门名称" name="name" rules={[{ required: true, message: '请输入部门名称' }]}>
                <Input />
              </Form.Item>
              <Form.Item label="部门编码" name="code">
                <Input />
              </Form.Item>
              <Form.Item label="负责人" name="manager_name">
                <Input />
              </Form.Item>
              <Form.Item label="组织类别" name="category">
                <Select 
                  placeholder="选择组织类别"
                  options={[
                    { label: '公司', value: '公司' },
                    { label: '部门', value: '部门' },
                    { label: '小组', value: '小组' },
                  ]}
                />
              </Form.Item>
              <Form.Item label="状态" name="status" initialValue="active">
                <Select
                  options={[
                    { label: '启用', value: 'active' },
                    { label: '停用', value: 'disabled' },
                  ]}
                />
              </Form.Item>
              <Form.Item label="设立日期" name="established_date">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item label="工作地点" name="location">
                <Select placeholder="请选择办公地点" allowClear>
                  {officeLocations.map(loc => (
                    <Select.Option key={loc.id} value={loc.id}>{loc.name}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item label="描述" name="description">
                <Input.TextArea rows={4} />
              </Form.Item>
            </Form>
          ) : (
            <>
              <Descriptions column={1} bordered>
                <Descriptions.Item label="部门名称">{selectedDept.name}</Descriptions.Item>
                <Descriptions.Item label="部门编码">{selectedDept.code || '-'}</Descriptions.Item>
                <Descriptions.Item label="负责人">{selectedDept.manager_name || '-'}</Descriptions.Item>
                <Descriptions.Item label="层级">{selectedDept.level}</Descriptions.Item>
                <Descriptions.Item label="组织类别">{selectedDept.category || '-'}</Descriptions.Item>
                <Descriptions.Item label="状态">
                    <Tag color={selectedDept.status === 'active' ? 'green' : 'red'}>
                        {selectedDept.status === 'active' ? '启用' : '停用'}
                    </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="设立日期">{selectedDept.established_date || '-'}</Descriptions.Item>
                <Descriptions.Item label="描述">{selectedDept.description || '-'}</Descriptions.Item>
              </Descriptions>
              <div className="mt-8 pt-4 border-t border-gray-100 flex justify-center">
                <Button 
                  danger 
                  size="large"
                  icon={<DeleteOutlined />} 
                  onClick={handleDelete}
                  className="w-2/3"
                >
                  删除该部门
                </Button>
              </div>
            </>
          )
        )}
      </Drawer>

      <Modal
        title="新建子部门"
        open={isCreateModalVisible}
        onCancel={() => setIsCreateModalVisible(false)}
        onOk={handleCreateSubDept}
        confirmLoading={creating}
        destroyOnClose
      >
        <Form form={createForm} layout="vertical" name="create_dept_form">
          <Form.Item label="父部门">
            <Input value={selectedDept?.name} disabled />
          </Form.Item>
          <Form.Item label="部门名称" name="name" rules={[{ required: true, message: '请输入部门名称' }]}>
            <Input />
          </Form.Item>
          <Form.Item label="部门编码" name="code">
            <Input />
          </Form.Item>
          <Form.Item label="负责人" name="manager_name">
            <Input />
          </Form.Item>
          <Form.Item label="组织类别" name="category">
            <Select 
              placeholder="选择组织类别"
              options={[
                { label: '公司', value: '公司' },
                { label: '部门', value: '部门' },
                { label: '小组', value: '小组' },
              ]}
            />
          </Form.Item>
          <Form.Item label="状态" name="status" initialValue="active">
            <Select
              options={[
                { label: '启用', value: 'active' },
                { label: '停用', value: 'disabled' },
              ]}
            />
          </Form.Item>
          <Form.Item label="设立日期" name="established_date">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="描述" name="description">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

import { ApartmentOutlined } from '@ant-design/icons';

export default Organization;
