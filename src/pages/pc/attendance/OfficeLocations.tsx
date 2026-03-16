import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, message, Popconfirm, Breadcrumb } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import api from '../../../lib/api';

interface OfficeLocation {
  id: number;
  name: string;
  city: string;
  address: string;
  latitude: number;
  longitude: number;
  radius: number;
}

const OfficeLocations: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<OfficeLocation[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form] = Form.useForm();

  const fetchLocations = async () => {
    setLoading(true);
    try {
      const response = await api.get('/office-locations/');
      setData(response.data);
    } catch (error) {
      console.error(error);
      message.error('获取办公地点失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  const handleAdd = () => {
    setEditingId(null);
    form.resetFields();
    form.setFieldsValue({ radius: 500 });
    setIsModalVisible(true);
  };

  const handleEdit = (record: OfficeLocation) => {
    setEditingId(record.id);
    form.setFieldsValue(record);
    setIsModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/office-locations/${id}`);
      message.success('删除成功');
      fetchLocations();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      if (editingId) {
        await api.put(`/office-locations/${editingId}`, values);
        message.success('更新成功');
      } else {
        await api.post('/office-locations/', values);
        message.success('创建成功');
      }
      setIsModalVisible(false);
      fetchLocations();
    } catch (error) {
      console.error(error);
      message.error('操作失败');
    }
  };

  const columns = [
    {
      title: '办公地点名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '城市',
      dataIndex: 'city',
      key: 'city',
    },
    {
      title: '详细地址',
      dataIndex: 'address',
      key: 'address',
    },
    {
      title: '坐标 (纬度, 经度)',
      key: 'coordinates',
      render: (record: OfficeLocation) => `${record.latitude}, ${record.longitude}`,
    },
    {
      title: '有效打卡距离 (米)',
      dataIndex: 'radius',
      key: 'radius',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: OfficeLocation) => (
        <div className="flex gap-2">
          <Button icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          <Popconfirm title="确定删除吗?" onConfirm={() => handleDelete(record.id)}>
            <Button icon={<DeleteOutlined />} danger />
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div className="p-4">
      <Breadcrumb
        items={[
          { title: '考勤管理' },
          { title: '打卡区域' },
        ]}
        className="mb-4"
      />

      <div className="mb-4">
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新增办公地点
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        pagination={{
            defaultPageSize: 10,
            pageSizeOptions: ['10', '50', '100'],
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`,
        }}
      />

      <Modal
        title={editingId ? '编辑办公地点' : '新增办公地点'}
        open={isModalVisible}
        onOk={handleOk}
        onCancel={() => setIsModalVisible(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="办公地点名称"
            rules={[{ required: true, message: '请输入办公地点名称' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="city"
            label="城市"
            rules={[{ required: true, message: '请输入城市' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="address"
            label="详细地址"
            rules={[{ required: true, message: '请输入详细地址' }]}
          >
            <Input />
          </Form.Item>
          <div className="flex gap-4">
            <Form.Item
              name="latitude"
              label="纬度"
              className="flex-1"
              rules={[{ required: true, message: '请输入纬度' }]}
            >
              <InputNumber style={{ width: '100%' }} precision={6} />
            </Form.Item>
            <Form.Item
              name="longitude"
              label="经度"
              className="flex-1"
              rules={[{ required: true, message: '请输入经度' }]}
            >
              <InputNumber style={{ width: '100%' }} precision={6} />
            </Form.Item>
          </div>
          <Form.Item
            name="radius"
            label="有效打卡距离 (米)"
            rules={[{ required: true, message: '请输入有效打卡距离' }]}
          >
            <InputNumber style={{ width: '100%' }} min={1} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default OfficeLocations;
