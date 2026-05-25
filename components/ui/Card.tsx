import { ReactNode } from "react";

interface CardProps {
  title: string;
  children: ReactNode;
  className?: string;
}

export function Card({ title, children, className = "" }: CardProps) {
  return (
    <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm ${className}`}>
      <h3 className="text-lg font-bold mb-4 text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-2">{title}</h3>
      <div>{children}</div>
    </div>
  );
}
