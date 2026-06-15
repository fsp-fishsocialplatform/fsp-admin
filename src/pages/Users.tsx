import { useCallback, useEffect, useState } from 'react';
import { Table, Tag, Button, Popconfirm, Typography, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { api, ApiError, type User } from '../api/client';

const PAGE_SIZE = 20;
const { Text } = Typography;

export default function Users() {
  const [data, setData] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);

  const load = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await api.listUsers(PAGE_SIZE, (p - 1) * PAGE_SIZE);
      setData(res.users ?? []);
      setTotal(res.total);
    } catch (err) {
      message.error(err instanceof ApiError ? err.message : '加载失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(page);
  }, [page, load]);

  async function onBan(id: string) {
    setActingId(id);
    try {
      await api.banUser(id);
      message.success('已封禁');
      await load(page);
    } catch (err) {
      message.error(err instanceof ApiError ? err.message : '操作失败');
    } finally {
      setActingId(null);
    }
  }

  async function onUnban(id: string) {
    setActingId(id);
    try {
      await api.unbanUser(id);
      message.success('已解封');
      await load(page);
    } catch (err) {
      message.error(err instanceof ApiError ? err.message : '操作失败');
    } finally {
      setActingId(null);
    }
  }

  const columns: ColumnsType<User> = [
    {
      title: '昵称',
      dataIndex: 'nickname',
      key: 'nickname',
      render: (nickname: string, row) => (
        <span>
          {nickname || <Text type="secondary">（无昵称）</Text>}
          {row.is_admin && (
            <Tag color="gold" style={{ marginLeft: 8 }}>
              管理员
            </Tag>
          )}
        </span>
      ),
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      key: 'phone',
      width: 140,
      render: (p: string) => p || '—',
    },
    {
      title: '访问次数',
      dataIndex: 'visit_count',
      key: 'visit_count',
      width: 100,
    },
    {
      title: '状态',
      dataIndex: 'is_banned',
      key: 'is_banned',
      width: 100,
      render: (banned: boolean) =>
        banned ? <Tag color="red">已封禁</Tag> : <Tag color="green">正常</Tag>,
    },
    {
      title: '注册时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (t: string) => new Date(t).toLocaleString('zh-CN'),
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_, row) => {
        // Never offer a ban control for admin accounts — locking the operator
        // out of their own console is an easy footgun.
        if (row.is_admin) return <Text type="secondary">—</Text>;
        return row.is_banned ? (
          <Button
            size="small"
            loading={actingId === row.id}
            onClick={() => onUnban(row.id)}
          >
            解封
          </Button>
        ) : (
          <Popconfirm
            title="确认封禁该用户？"
            onConfirm={() => onBan(row.id)}
            okText="封禁"
            cancelText="取消"
          >
            <Button danger size="small" loading={actingId === row.id}>
              封禁
            </Button>
          </Popconfirm>
        );
      },
    },
  ];

  return (
    <Table<User>
      rowKey="id"
      columns={columns}
      dataSource={data}
      loading={loading}
      pagination={{
        current: page,
        pageSize: PAGE_SIZE,
        total,
        showSizeChanger: false,
        onChange: setPage,
      }}
    />
  );
}
