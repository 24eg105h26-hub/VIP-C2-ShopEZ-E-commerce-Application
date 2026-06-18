import React from 'react';

export const ProductGridSkeleton = ({ count = 6 }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white dark:bg-premium-card border border-zinc-200 dark:border-premium-border/40 rounded-2xl overflow-hidden p-4 space-y-4 animate-pulse">
          <div className="aspect-square bg-zinc-200 dark:bg-premium-border rounded-xl" />
          <div className="space-y-2">
            <div className="h-3 bg-zinc-200 dark:bg-premium-border rounded-md w-1/3" />
            <div className="h-4 bg-zinc-200 dark:bg-premium-border rounded-md w-3/4" />
            <div className="h-3 bg-zinc-200 dark:bg-premium-border rounded-md w-full" />
          </div>
          <div className="flex justify-between items-center pt-2">
            <div className="h-4 bg-zinc-200 dark:bg-premium-border rounded-md w-1/4" />
            <div className="h-8 bg-zinc-200 dark:bg-premium-border rounded-md w-8 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
};

export const DetailSkeleton = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 animate-pulse">
      <div className="aspect-square bg-zinc-200 dark:bg-premium-border rounded-2xl" />
      <div className="space-y-6 py-4">
        <div className="h-3 bg-zinc-200 dark:bg-premium-border rounded-md w-1/4" />
        <div className="h-8 bg-zinc-200 dark:bg-premium-border rounded-md w-3/4" />
        <div className="h-4 bg-zinc-200 dark:bg-premium-border rounded-md w-full" />
        <div className="h-4 bg-zinc-200 dark:bg-premium-border rounded-md w-5/6" />
        <hr className="border-zinc-200 dark:border-premium-border" />
        <div className="h-6 bg-zinc-200 dark:bg-premium-border rounded-md w-1/3" />
        <div className="flex gap-4">
          <div className="h-12 bg-zinc-200 dark:bg-premium-border rounded-xl w-3/4" />
          <div className="h-12 bg-zinc-200 dark:bg-premium-border rounded-xl w-12" />
        </div>
      </div>
    </div>
  );
};
