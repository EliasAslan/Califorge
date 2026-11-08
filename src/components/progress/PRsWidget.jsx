import React from 'react';
import { ChevronRight, Trophy } from 'lucide-react';
import { countPersonalRecords, getAllPersonalRecords } from '@/lib/trainingLogic';

export default function PRsWidget({ sessions, onClick, className }) {
  const count = countPersonalRecords(sessions);
  const recent = getAllPersonalRecords(sessions).slice(0, 1);

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      className={`h-[224px] min-h-[224px] rounded-2xl border border-border bg-card/50 p-2.5 sm:p-4 active:scale-[0.99] transition-transform cursor-pointer flex flex-col items-start justify-between gap-2 ${className || ''}`}
    >
      <div className="flex w-full items-center justify-between gap-1">
        <div className="flex items-center gap-2">
          <Trophy size={15} className="text-muted-foreground" />
          <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground font-semibold">PRs</p>
        </div>
        <ChevronRight size={14} className="text-muted-foreground" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="text-[1.7rem] font-extrabold tnum leading-none">{count}</span>
          <span className="text-xs text-muted-foreground">records</span>
        </div>
        {recent[0] && (
          <p className="text-[9px] text-muted-foreground mt-1 truncate">
            <span className="font-semibold text-foreground">{recent[0].record.label}</span> · {recent[0].name}
          </p>
        )}
      </div>
    </div>
  );
}