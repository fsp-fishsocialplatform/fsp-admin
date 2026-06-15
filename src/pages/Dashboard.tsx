import { useEffect, useState } from 'react';
import { Card, Col, Row, Statistic, Spin, Alert } from 'antd';
import { api, ApiError, type Stats } from '../api/client';

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .stats()
      .then((s) => {
        if (!cancelled) setStats(s);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : '加载失败');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return <Alert type="error" message={error} showIcon />;
  }

  if (!stats) return null;

  const cards = [
    { title: '用户总数', value: stats.total_users },
    { title: '已发布帖子', value: stats.total_posts },
    { title: '今日新增用户', value: stats.new_users_today },
    { title: '今日新增帖子', value: stats.new_posts_today },
    { title: '已下架帖子', value: stats.deleted_posts },
    { title: '已封禁用户', value: stats.banned_users },
  ];

  return (
    <Row gutter={[16, 16]}>
      {cards.map((c) => (
        <Col xs={24} sm={12} md={8} key={c.title}>
          <Card>
            <Statistic title={c.title} value={c.value} />
          </Card>
        </Col>
      ))}
    </Row>
  );
}
