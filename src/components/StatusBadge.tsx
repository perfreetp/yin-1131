import { PackageStatus, ExceptionStatus, STATUS_LABELS } from '@/types';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: PackageStatus | ExceptionStatus;
  size?: 'sm' | 'md';
}

const statusStyles: Record<string, string> = {
  in_use: 'bg-warning-100 text-warning-600 border-warning-200',
  recycled: 'bg-neutral-100 text-neutral-600 border-neutral-200',
  cleaning: 'bg-primary-100 text-primary-600 border-primary-200',
  cleaned: 'bg-primary-50 text-primary-700 border-primary-100',
  sterilizing: 'bg-primary-100 text-primary-600 border-primary-200',
  sterilized: 'bg-success-100 text-success-600 border-success-500',
  expired: 'bg-danger-100 text-danger-600 border-danger-200',
  abnormal: 'bg-danger-100 text-danger-600 border-danger-200',
  pending: 'bg-warning-100 text-warning-600 border-warning-200',
  processing: 'bg-primary-100 text-primary-600 border-primary-200',
  closed: 'bg-neutral-100 text-neutral-500 border-neutral-200',
};

const statusLabels: Record<string, string> = {
  ...STATUS_LABELS,
  pending: '待处理',
  processing: '处理中',
  closed: '已闭环',
};

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  return (
    <span
      className={cn(
      'inline-flex items-center justify-center rounded-full border font-medium',
      statusStyles[status] || 'bg-neutral-100 text-neutral-600',
      size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'
    )}
    >
      <span
        className={cn(
          'mr-1.5 rounded-full',
          size === 'sm' ? 'h-1.5 w-1.5' : 'h-2 w-2',
          status === 'in_use' && 'bg-warning-500',
          status === 'recycled' && 'bg-neutral-500',
          status === 'cleaning' && 'bg-primary-500',
          status === 'cleaned' && 'bg-primary-600',
          status === 'sterilizing' && 'bg-primary-500',
          status === 'sterilized' && 'bg-success-500',
          status === 'expired' && 'bg-danger-500',
          status === 'abnormal' && 'bg-danger-500',
          status === 'pending' && 'bg-warning-500',
          status === 'processing' && 'bg-primary-500',
          status === 'closed' && 'bg-neutral-400'
        )}
      />
      {statusLabels[status] || status}
    </span>
  );
}
