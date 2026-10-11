"use client";

import React from "react";
import { Clock3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const TimeLeft = ({ open, setOpen }: { open: boolean; setOpen: React.Dispatch<React.SetStateAction<boolean>> }) => (
  <Dialog open={open} onOpenChange={setOpen}>
    <DialogContent className="rounded-2xl border-slate-200 sm:max-w-md">
      <DialogHeader>
        <div className="mb-2 grid h-11 w-11 place-items-center rounded-xl bg-amber-50 text-amber-600 ring-1 ring-inset ring-amber-100">
          <Clock3 className="h-5 w-5" />
        </div>
        <DialogTitle className="text-lg font-bold text-slate-900">Five minutes remaining</DialogTitle>
        <DialogDescription className="text-sm leading-6">
          Your time is nearly up. Review any unanswered questions and submit before the timer expires. The quiz will be
          submitted automatically when time runs out.
        </DialogDescription>
      </DialogHeader>
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        Keep working and remember to submit your answers.
      </div>
      <DialogFooter>
        <Button type="button" onClick={() => setOpen(false)} className="rounded-xl bg-indigo-600 hover:bg-indigo-700">
          Continue quiz
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

export default TimeLeft;
