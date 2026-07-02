import React, { forwardRef } from 'react';
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ============================
// Button
// ============================
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  isLoading, 
  icon, 
  className = '', 
  disabled,
  ...props 
}, ref) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] select-none';
  
  const variants = {
    primary: 'bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-premium focus:ring-primary',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 focus:ring-secondary border border-border/50',
    ghost: 'hover:bg-accent hover:text-accent-foreground focus:ring-accent',
    destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:shadow-premium focus:ring-destructive'
  };

  const sizes = {
    sm: 'h-8 px-3 text-xs',
    md: 'h-10 px-4 py-2 text-sm',
    lg: 'h-12 px-6 text-base'
  };

  return (
    <button 
      ref={ref}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin text-current/80" /> : icon && <span className="mr-2">{icon}</span>}
      {children}
    </button>
  );
});

// ============================
// Card
// ============================
export const Card = forwardRef<HTMLDivElement, { children: ReactNode; className?: string }>(({ children, className = '' }, ref) => {
  return (
    <div ref={ref} className={`bg-card text-card-foreground rounded-xl border border-border/50 shadow-sm transition-shadow duration-300 hover:shadow-premium-hover ${className}`}>
      {children}
    </div>
  );
});

// ============================
// Input
// ============================
export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(({ className = '', ...props }, ref) => {
  return (
    <input 
      ref={ref}
      className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 transition-colors duration-200 ${className}`}
      {...props}
    />
  );
});

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
    default: 'bg-secondary text-secondary-foreground border border-border/50',
    success: 'bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/20',
    warning: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border border-yellow-500/20',
    destructive: 'bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/20',
    info: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20'
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold transition-colors duration-200 ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}

// ============================
// Skeleton (Premium Shimmer)
// ============================
export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden bg-muted/60 rounded-md ${className}`}>
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
    </div>
  );
}

// ============================
// EmptyState (Premium Guided State)
// ============================
interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}
export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="flex flex-col items-center justify-center p-14 text-center rounded-2xl border border-dashed border-border/60 bg-muted/30"
    >
      <div className="w-16 h-16 bg-background rounded-full flex items-center justify-center mb-5 text-muted-foreground shadow-sm ring-1 ring-border/50">
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-2 tracking-tight">{title}</h3>
      <p className="text-muted-foreground text-sm max-w-sm mb-7 leading-relaxed">{description}</p>
      {action && (
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          {action}
        </motion.div>
      )}
    </motion.div>
  );
}

// ============================
// ErrorState
// ============================
export function ErrorState({ title = 'Ops! Algo deu errado.', message, onRetry }: { title?: string; message: string; onRetry?: () => void }) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="p-6 rounded-xl bg-destructive/5 border border-destructive/20 text-center shadow-sm"
    >
      <AlertCircle className="w-10 h-10 text-destructive/80 mx-auto mb-4" />
      <h3 className="font-semibold text-destructive mb-1 tracking-tight">{title}</h3>
      <p className="text-sm text-destructive/80 mb-5">{message}</p>
      {onRetry && (
        <Button variant="destructive" size="sm" onClick={onRetry}>Tentar Novamente</Button>
      )}
    </motion.div>
  );
}

// ============================
// Progress
// ============================
export function Progress({ value = 0, className = '' }: { value: number; className?: string }) {
  return (
    <div className={`overflow-hidden rounded-full bg-secondary/80 shadow-inner ${className}`}>
      <motion.div 
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(Math.max(value, 0), 100)}%` }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
        className="h-full bg-primary" 
      />
    </div>
  );
}
