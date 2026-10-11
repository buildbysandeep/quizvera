"use client";

import * as React from "react";
import { CalendarIcon } from "@radix-ui/react-icons";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export type CalendarDateRangePickerProps = {
  value: DateRange;
  onChange: (range: DateRange | undefined) => void;
  className?: string;
};

export function CalendarDateRangePicker({ value, onChange, className }: CalendarDateRangePickerProps) {
  const [open, setOpen] = React.useState(false);

  const dateLabel = value.from
    ? value.to
      ? `${format(value.from, "LLL dd, yyyy")} – ${format(value.to, "LLL dd, yyyy")}`
      : format(value.from, "LLL dd, yyyy")
    : "Choose date range";

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id="dashboard-date-range"
            type="button"
            variant="outline"
            size="sm"
            aria-label="Choose dashboard date range"
            className={cn(
              "h-10 w-full justify-start gap-2 rounded-xl border-slate-200 bg-white px-3 text-left font-medium text-slate-700 shadow-sm sm:w-auto sm:min-w-[270px]",
              !value.from && "text-slate-500",
            )}
          >
            <CalendarIcon className="h-4 w-4 shrink-0 text-indigo-600" />
            <span className="truncate">{dateLabel}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto rounded-xl border-slate-200 p-0 shadow-lg" align="end">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={value.from}
            selected={value}
            onSelect={(range) => {
              onChange(range);
              if (range?.from && range?.to) setOpen(false);
            }}
            numberOfMonths={2}
            disabled={{ after: new Date() }}
          />
          <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-3 py-2.5">
            <p className="text-xs text-slate-500">Select a start and end date.</p>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-8 text-xs"
              onClick={() => {
                onChange(undefined);
                setOpen(false);
              }}
            >
              Reset period
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
