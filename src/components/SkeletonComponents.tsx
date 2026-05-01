/**
 * Skeleton Loading Components
 * Reusable loading states for all panels
 */

import React from 'react';
import { cn } from '../lib/utils';

/**
 * Base skeleton shimmer animation
 */
const shimmerClass = "animate-pulse bg-gradient-to-r from-brd via-paper to-brd bg-[length:200%_100%]";

/**
 * Text skeleton line
 */
export function SkeletonText({ lines = 3, className = '' }: { lines?: number; className?: string }) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className={cn('h-4 rounded-lg', shimmerClass)} style={{ width: `${100 - i * 15}%` }} />
      ))}
    </div>
  );
}

/**
 * Card skeleton for lists
 */
export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={cn('bg-card border border-brd rounded-2xl p-6 space-y-4', className)}>
      <div className="flex items-center gap-4">
        <div className={cn('w-12 h-12 rounded-xl', shimmerClass)} />
        <div className="flex-1 space-y-2">
          <div className={cn('h-4 w-3/4 rounded-lg', shimmerClass)} />
          <div className={cn('h-3 w-1/2 rounded-lg', shimmerClass)} />
        </div>
      </div>
      <div className={cn('h-20 rounded-lg', shimmerClass)} />
    </div>
  );
}

/**
 * Grid skeleton for asset library
 */
export function SkeletonGrid({ items = 8, className = '' }: { items?: number; className?: string }) {
  return (
    <div className={cn('grid grid-cols-2 md:grid-cols-4 gap-4', className)}>
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className={cn('aspect-square rounded-2xl', shimmerClass)} />
      ))}
    </div>
  );
}

/**
 * KPI card skeleton
 */
export function SkeletonKPICard({ className = '' }: { className?: string }) {
  return (
    <div className={cn('bg-card border border-brd rounded-2xl p-6', className)}>
      <div className="flex justify-between items-start mb-4">
        <div className={cn('h-3 w-20 rounded-lg', shimmerClass)} />
        <div className={cn('w-10 h-10 rounded-xl', shimmerClass)} />
      </div>
      <div className={cn('h-8 w-24 rounded-lg mb-2', shimmerClass)} />
      <div className={cn('h-3 w-16 rounded-lg', shimmerClass)} />
    </div>
  );
}

/**
 * Calendar day skeleton
 */
export function SkeletonCalendarDay({ className = '' }: { className?: string }) {
  return (
    <div className={cn('min-h-[100px] p-2 border border-brd rounded-lg', className)}>
      <div className={cn('w-7 h-7 rounded-full mb-2 ml-1', shimmerClass)} />
      <div className="space-y-1">
        <div className={cn('h-6 rounded-md', shimmerClass)} />
        <div className={cn('h-6 rounded-md w-3/4', shimmerClass)} />
      </div>
    </div>
  );
}

/**
 * Calendar grid skeleton
 */
export function SkeletonCalendarGrid({ className = '' }: { className?: string }) {
  return (
    <div className={cn('bg-card border border-brd rounded-2xl overflow-hidden', className)}>
      {/* Week days header */}
      <div className="grid grid-cols-7 border-b border-brd">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="p-3 text-center">
            <div className={cn('h-3 w-8 mx-auto rounded-lg', shimmerClass)} />
          </div>
        ))}
      </div>
      {/* Days grid */}
      <div className="grid grid-cols-7">
        {Array.from({ length: 35 }).map((_, i) => (
          <SkeletonCalendarDay key={i} />
        ))}
      </div>
    </div>
  );
}

/**
 * Chart skeleton
 */
export function SkeletonChart({ className = '' }: { className?: string }) {
  return (
    <div className={cn('bg-card border border-brd rounded-2xl p-8', className)}>
      <div className={cn('h-4 w-40 rounded-lg mb-8', shimmerClass)} />
      <div className={cn('h-[200px] rounded-xl', shimmerClass)} />
    </div>
  );
}

/**
 * Button skeleton
 */
export function SkeletonButton({ className = '' }: { className?: string }) {
  return (
    <div className={cn('h-12 w-32 rounded-xl', shimmerClass)} />
  );
}

/**
 * Avatar skeleton
 */
export function SkeletonAvatar({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-8 h-8 rounded-full',
    md: 'w-12 h-12 rounded-full',
    lg: 'w-20 h-20 rounded-full'
  };
  return <div className={cn(sizeClasses[size], shimmerClass)} />;
}

/**
 * Full panel skeleton loader
 */
export function SkeletonPanel({ className = '' }: { className?: string }) {
  return (
    <div className={cn('max-w-7xl mx-auto space-y-8 pb-20', className)}>
      {/* Header */}
      <div className="flex justify-between items-end gap-6">
        <div className="space-y-2">
          <div className={cn('h-3 w-24 rounded-lg', shimmerClass)} />
          <div className={cn('h-10 w-64 rounded-lg', shimmerClass)} />
          <div className={cn('h-4 w-96 rounded-lg', shimmerClass)} />
        </div>
        <div className="flex gap-3">
          <SkeletonButton />
          <SkeletonButton />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SkeletonKPICard />
        <SkeletonKPICard />
        <SkeletonKPICard />
        <SkeletonKPICard />
      </div>

      {/* Chart */}
      <SkeletonChart />

      {/* List */}
      <div className="space-y-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  );
}

/**
 * Inline loading spinner with text
 */
export function LoadingSpinner({ text = 'Loading...', className = '' }: { text?: string; className?: string }) {
  return (
    <div className={cn('flex items-center justify-center gap-3 p-8', className)}>
      <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
      <span className="text-sm text-ink-muted font-medium">{text}</span>
    </div>
  );
}

/**
 * Page-level loading state
 */
export function PageLoader({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="min-h-screen bg-paper flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-ink-muted font-medium">{message}</p>
      </div>
    </div>
  );
}