"use client";

import * as React from "react";
import { CaretSortIcon, CheckIcon } from "@radix-ui/react-icons";
import { Layers3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { DashboardGroupOption } from "@/types/dashboard";

export type GroupSwitcherProps = {
  groups: DashboardGroupOption[];
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
};

export default function GroupSwitcher({ groups, value, onValueChange, className }: GroupSwitcherProps) {
  const [open, setOpen] = React.useState(false);
  const selectedGroup = groups.find((group) => group.id === value);
  const selectedLabel = value === "all" ? "All folders" : (selectedGroup?.name ?? "Select folder");

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label="Filter dashboard by folder"
          className={cn(
            "h-10 w-full justify-between gap-2 rounded-xl border-slate-200 bg-white px-3 text-sm font-medium shadow-sm sm:w-[220px]",
            className,
          )}
        >
          <span className="flex min-w-0 items-center gap-2">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-indigo-50">
              <Layers3 className="h-3.5 w-3.5 text-indigo-600" />
            </span>
            <span className="truncate">{selectedLabel}</span>
          </span>
          <CaretSortIcon className="h-4 w-4 shrink-0 text-slate-400" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[260px] rounded-xl border-slate-200 p-0 shadow-lg">
        <Command>
          <CommandInput placeholder="Search folders..." />
          <CommandList>
            <CommandEmpty>No folders found.</CommandEmpty>
            <CommandGroup heading="Folder scope">
              <CommandItem
                value="All folders"
                onSelect={() => {
                  onValueChange("all");
                  setOpen(false);
                }}
                className="gap-2 py-2.5"
              >
                <Layers3 className="h-4 w-4 text-slate-500" />
                <span>All folders</span>
                <CheckIcon className={cn("ml-auto h-4 w-4", value === "all" ? "opacity-100" : "opacity-0")} />
              </CommandItem>
              {groups.map((group) => (
                <CommandItem
                  key={group.id}
                  value={`${group.name} ${group.id}`}
                  onSelect={() => {
                    onValueChange(group.id);
                    setOpen(false);
                  }}
                  className="gap-2 py-2.5"
                >
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-slate-100 text-[10px] font-bold uppercase text-slate-600">
                    {group.name.trim().slice(0, 2) || "G"}
                  </span>
                  <span className="min-w-0 flex-1 truncate">{group.name}</span>
                  <CheckIcon className={cn("h-4 w-4", value === group.id ? "opacity-100" : "opacity-0")} />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
