import React, { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';

// ============================
// Button
// ============================
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon?: ReactNode;
}

export function Button({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  isLoading, 
  icon, 
  className = '', 
  disabled,
  ...props 
}: ButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm focus:ring-primary',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 focus:ring-secondary',
    ghost: 'hover:bg-accent hover:text-accent-foreground focus:ring-accent',
    destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 focus:ring-destructive'
  };

  const sizes = {
    sm: 'h-8 px-3 text-xs',
    md: 'h-10 px-4 py-2 text-sm',
    lg: 'h-12 px-6 text-base'
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : icon && <span className="mr-2">{icon}</span>}
      {children}
    </button>
  );
}

// ============================
// Card
// ============================
export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`bg-card text-card-foreground rounded-xl border border-border/50 shadow-sm ${className}`}>
      {children}
    </div>
  );
}

// ============================
// Input
// ============================
export function Input({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input 
      className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 transition-colors ${className}`}
      {...props}
    />
  );
}

// ============================
// Badge
// ============================
interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'destructive' | 'info';
  className?: string;
}
export function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  const variants = {
    default: 'bg-secondary text-secondary-foreground',
    success: 'bg-green-500/15 text-green-600 dark:text-green-400',
    warning: 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400',
    destructive: 'bg-red-500/15 text-red-600 dark:text-red-400',
    info: 'bg-blue-500/15 text-blue-600 dark:text-blue-400'
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold transition-colors ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}

// ============================
// Skeleton
// ============================
export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-muted rounded-md ${className}`} />
  );
}

// ============================
// EmptyState
// ============================
interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}
export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center animate-in fade-in zoom-in duration-300">
      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4 text-muted-foreground">
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm max-w-sm mb-6">{description}</p>
      {action}
    </div>
  );
}

// ============================
// ErrorState
// ============================
export function ErrorState({ title = 'Ops! Algo deu errado.', message, onRetry }: { title?: string; message: string; onRetry?: () => void }) {
  return (
    <div className="p-6 rounded-lg bg-destructive/10 border border-destructive/20 text-center animate-in fade-in duration-300">
      <AlertCircle className="w-10 h-10 text-destructive mx-auto mb-3" />
      <h3 className="font-semibold text-destructive mb-1">{title}</h3>
      <p className="text-sm text-destructive/80 mb-4">{message}</p>
      {onRetry && (
        <Button variant="destructive" size="sm" onClick={onRetry}>Tentar Novamente</Button>
      )}
    </div>
  );
}

// ============================
// Progress
// ============================
export function Progress({ value = 0, className = '' }: { value: number; className?: string }) {
  return (
    <div className={`overflow-hidden rounded-full ${className}`}>
      <div 
        className="h-full bg-primary transition-all duration-300 ease-in-out" 
        style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }} 
      />
    </div>
  );
}
