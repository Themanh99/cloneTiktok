import { Alert, Button, Result, Skeleton, Spin } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';

export function PageLoading({ label }: { label?: string }) {
  return (
    <div className="flex min-h-[320px] flex-col items-center justify-center gap-3">
      <Spin size="large" />
      {label && <p className="text-sm text-text-secondary">{label}</p>}
    </div>
  );
}

export function PageSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="mx-auto w-full max-w-[960px] space-y-6 py-6">
      <Skeleton active avatar paragraph={{ rows }} />
      <Skeleton active paragraph={{ rows }} />
    </div>
  );
}

export function InlineError({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <Alert
      showIcon
      type="error"
      message={message}
      action={
        onRetry ? (
          <Button size="small" icon={<ReloadOutlined />} onClick={onRetry}>
            Retry
          </Button>
        ) : undefined
      }
    />
  );
}

export function PageError({
  title,
  description,
  onRetry,
}: {
  title: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <Result
      status="error"
      title={title}
      subTitle={description}
      extra={
        onRetry ? (
          <Button type="primary" icon={<ReloadOutlined />} onClick={onRetry}>
            Retry
          </Button>
        ) : undefined
      }
    />
  );
}
