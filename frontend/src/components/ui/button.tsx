import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva('inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/50 disabled:opacity-50 disabled:pointer-events-none cursor-pointer', {
  variants: {
    variant: {
      default: 'bg-cyan-400 text-[#042034] hover:bg-cyan-300',
      secondary: 'bg-white/[0.055] border border-white/[0.10] text-slate-200 hover:bg-white/[0.10] hover:text-white',
      ghost: 'text-slate-400 hover:bg-white/[0.06] hover:text-white',
      outline: 'border border-cyan-400/30 text-cyan-300 bg-cyan-400/5 hover:bg-cyan-400/10'
    },
    size: { default: 'h-9 px-4 py-2', sm: 'h-8 px-3 text-xs', icon: 'h-9 w-9' }
  },
  defaultVariants: { variant: 'default', size: 'default' }
});

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {}
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, ...props }, ref) => <button ref={ref} className={cn(buttonVariants({ variant, size, className }))} {...props}/>);
Button.displayName = 'Button';
