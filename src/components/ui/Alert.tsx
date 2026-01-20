import { cn } from '@/lib/utils';

interface AlertProps {
  children: React.ReactNode;
  variant?: 'info' | 'success' | 'warning' | 'error';
  className?: string;
}

const variantStyles = {
  info: 'bg-blue-50 text-blue-800 border-blue-200',
  success: 'bg-green-50 text-green-800 border-green-200',
  warning: 'bg-yellow-50 text-yellow-800 border-yellow-200',
  error: 'bg-red-50 text-red-800 border-red-200',
};

export function Alert({ children, variant = 'info', className }: AlertProps) {
  return (
    <div
      className={cn(
        'px-4 py-3 rounded-lg border text-sm',
        variantStyles[variant],
        className
      )}
      role="alert"
    >
      {children}
    </div>
  );
}
