import { useCallback, useEffect, useState } from 'react';
import { Table, Tag, Button, Popconfirm, Typography, message, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  api,
  ApiError,
  type ModerationQueueItem,
  type ModerationReview,
} from '../api/client';

const PAGE_SIZE = 20;
const { Text } = Typography;

// labelSummary turns the machine review's labels JSON (an array of per-sub-call
// {api, suggestion, label, score}) into a short, human-scannable string. Falls
// back gracefully if the payload isn't the expected shape.
function labelSummary(review: ModerationReview): string {
  if (!review.labels) return review.verdict;
  try {
    const subs = JSON.parse(review.labels) as Array<{
      API?: string;
      Label?: string;
      Suggestion?: string;
      Score?: number;
    }>;
    const parts = subs
      .filter((s) => s.Suggestion && s.Suggestion !== 'pass')
      .map(
        (s) =>
          `${s.API ?? ''}:${s.Label ?? ''}${
            typeof s.Score === 'number' ? ` (${Math.round(s.Score * 100)})` : ''
          }`,
      );
    return parts.length ? parts.join('，') : review.verdict;
  } catch {
    return review.verdict;
  }
}

export default function ModerationQueue() {
  const [data, setData] = useState<ModerationQueueItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);

  const load = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await api.moderationQueue(PAGE_SIZE, (p - 1) * PAGE_SIZE);
      setData(res.items ?? []);
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

  async function onApprove(id: string) {
    setActingId(id);
    try {
      await api.approvePost(id);
      message.success('已通过');
      await load(page);
    } catch (err) {
      message.error(err instanceof ApiError ? err.message : '操作失败');
    } finally {
      setActingId(null);
    }
  }

  async function onReject(id: string) {
    setActingId(id);
    try {
      await api.rejectPost(id);
      message.success('已拒绝');
      await load(page);
    } catch (err) {
      message.error(err instanceof ApiError ? err.message : '操作失败');
    } finally {
      setActingId(null);
    }
  }

  const columns: ColumnsType<ModerationQueueItem> = [
    {
      title: '标题',
      key: 'title',
      render: (_, row) => (
        <div>
          <div>{row.post.title || <Text type="secondary">（无标题）</Text>}</div>
          {row.post.body && (
            <Text type="secondary" ellipsis style={{ fontSize: 12 }}>
              {row.post.body}
            </Text>
          )}
        </div>
      ),
    },
    {
      title: '作者',
      key: 'author',
      width: 140,
      render: (_, row) => row.post.author_nickname,
    },
    {
      title: '机审结果',
      key: 'review',
      width: 220,
      render: (_, row) => (
        <Tooltip title={`trace: ${row.review.trace_id || '—'}`}>
          <Tag color="orange">{labelSummary(row.review)}</Tag>
        </Tooltip>
      ),
    },
    {
      title: '提交时间',
      key: 'created_at',
      width: 180,
      render: (_, row) => new Date(row.post.created_at).toLocaleString('zh-CN'),
    },
    {
      title: '操作',
      key: 'action',
      width: 170,
      render: (_, row) => (
        <>
          <Button
            type="primary"
            size="small"
            loading={actingId === row.post.id}
            onClick={() => onApprove(row.post.id)}
            style={{ marginRight: 8 }}
          >
            通过
          </Button>
          <Popconfirm
            title="确认拒绝这条帖子？"
            onConfirm={() => onReject(row.post.id)}
            okText="拒绝"
            cancelText="取消"
          >
            <Button danger size="small" loading={actingId === row.post.id}>
              拒绝
            </Button>
          </Popconfirm>
        </>
      ),
    },
  ];

  return (
    <Table<ModerationQueueItem>
      rowKey={(row) => row.post.id}
      columns={columns}
      dataSource={data}
      loading={loading}
      locale={{ emptyText: '没有待复核的内容' }}
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
