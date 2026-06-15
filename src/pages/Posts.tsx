import { useCallback, useEffect, useState } from 'react';
import {
  Table,
  Tag,
  Button,
  Popconfirm,
  Typography,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { api, ApiError, type Post } from '../api/client';

const PAGE_SIZE = 20;
const { Text } = Typography;

export default function Posts() {
  const [data, setData] = useState<Post[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  // Tracks the row currently being taken down / restored so only its button spins.
  const [actingId, setActingId] = useState<string | null>(null);

  const load = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await api.listPosts(PAGE_SIZE, (p - 1) * PAGE_SIZE);
      setData(res.posts ?? []);
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

  async function onTakedown(id: string) {
    setActingId(id);
    try {
      await api.takedownPost(id);
      message.success('已下架');
      await load(page);
    } catch (err) {
      message.error(err instanceof ApiError ? err.message : '操作失败');
    } finally {
      setActingId(null);
    }
  }

  async function onRestore(id: string) {
    setActingId(id);
    try {
      await api.restorePost(id);
      message.success('已恢复');
      await load(page);
    } catch (err) {
      message.error(err instanceof ApiError ? err.message : '操作失败');
    } finally {
      setActingId(null);
    }
  }

  const columns: ColumnsType<Post> = [
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      render: (title: string, row) => (
        <div>
          <div>{title || <Text type="secondary">（无标题）</Text>}</div>
          {row.body && (
            <Text type="secondary" ellipsis style={{ fontSize: 12 }}>
              {row.body}
            </Text>
          )}
        </div>
      ),
    },
    {
      title: '作者',
      dataIndex: 'author_nickname',
      key: 'author_nickname',
      width: 140,
    },
    {
      title: '鱼种',
      dataIndex: 'species',
      key: 'species',
      width: 100,
      render: (s: string) => s || '—',
    },
    {
      title: '热度',
      dataIndex: 'heat_score',
      key: 'heat_score',
      width: 80,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) =>
        status === 'published' ? (
          <Tag color="green">已发布</Tag>
        ) : status === 'deleted' ? (
          <Tag color="red">已下架</Tag>
        ) : (
          <Tag>{status}</Tag>
        ),
    },
    {
      title: '发布时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (t: string) => new Date(t).toLocaleString('zh-CN'),
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_, row) =>
        row.status === 'published' ? (
          <Popconfirm
            title="确认下架这条帖子？"
            onConfirm={() => onTakedown(row.id)}
            okText="下架"
            cancelText="取消"
          >
            <Button danger size="small" loading={actingId === row.id}>
              下架
            </Button>
          </Popconfirm>
        ) : (
          <Button
            size="small"
            loading={actingId === row.id}
            onClick={() => onRestore(row.id)}
          >
            恢复
          </Button>
        ),
    },
  ];

  return (
    <Table<Post>
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
