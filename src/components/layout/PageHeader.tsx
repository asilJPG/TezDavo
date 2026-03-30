"use client";
// src/components/layout/PageHeader.tsx
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  rightSlot?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  subtitle,
  showBack = true,
  rightSlot,
  className,
}: PageHeaderProps) {
  const router = useRouter();
  return (
    <header
      className={cn(
        "bg-white border-b px-4 py-3 flex items-center gap-3 sticky top-0 z-40",
        className
      )}
    >
      {showBack && (
        <button
          onClick={() => router.back()}
          className="text-gray-500 text-xl flex-shrink-0 w-8"
        >
          ←
        </button>
      )}
      <div className="flex-1 min-w-0">
        <h1 className="font-semibold text-gray-900 truncate">{title}</h1>
        {subtitle && (
          <p className="text-xs text-gray-400 truncate">{subtitle}</p>
        )}
      </div>
      {rightSlot}
    </header>
  );
}
