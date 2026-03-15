import React, { useEffect, useState } from 'react';
import { Tree, Card, Button, Input, Row, Col, Drawer, Descriptions, Tag, message, Spin, Empty } from 'antd';
import { ImportOutlined, SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import api from '../../lib/api';

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
}

const Organization: React.FC = () => {
  const [treeData, setTreeData] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [selectedDept, setSelectedDept] = useState<Department | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([]);
  const [autoExpandParent, setAutoExpandParent] = useState(true);

  const fetchTree = async () => {
    setLoading(true);
    try {
      const res = await api.get('/departments/tree');
      setTreeData(res.data);
      // Auto expand root
      if (res.data.length > 0) {
          setExpandedKeys([res.data[0].key]);
      }
    } catch (error) {
      message.error('获取组织架构失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTree();
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
      // Find full dept data from tree (info.node is structured for Tree, might miss some fields if we didn't put them in title)
      // Actually we put full data in the node object in backend build_tree? 
      // Yes, we returned a dict. Antd Tree uses 'title', 'key', 'children'. Other fields are preserved in info.node?
      // Let's check backend. We put extra fields in the dict.
      setSelectedDept(info.node as Department);
      setDrawerVisible(true);
    }
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
    <div className="h-full flex flex-col">
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">组织架构</h2>
        <div className="space-x-2">
            <Button icon={<ReloadOutlined />} onClick={fetchTree}>刷新</Button>
            <Button type="primary" icon={<ImportOutlined />} loading={importing} onClick={handleImport}>
            导入组织架构
            </Button>
        </div>
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
        title="部门详情"
        placement="right"
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        width={500}
      >
        {selectedDept && (
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
        )}
      </Drawer>
    </div>
  );
};

import { ApartmentOutlined } from '@ant-design/icons';

export default Organization;
