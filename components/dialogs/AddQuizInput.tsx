"use client";

import React from "react";
import { ClipboardPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const AddQuizInputDialog = ({ addInput }: { addInput: React.Dispatch<React.SetStateAction<string[]>> }) => {
  const [open, setOpen] = React.useState(false);
  const [text, setText] = React.useState("");
  const [formError, setFormError] = React.useState("");

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = text.trim();
    if (!value) {
      setFormError("Enter a field name first.");
      return;
    }
    addInput((previous) => (previous.includes(value) ? previous : [...previous, value]));
    setText("");
    setFormError("");
    setOpen(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) {
          setFormError("");
          setText("");
        }
      }}
    >
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="h-9 gap-2 rounded-xl border-slate-200 bg-white text-slate-700 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
        >
          <ClipboardPlus className="h-4 w-4" /> Add input field
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-2xl border-slate-200 sm:max-w-md">
        <DialogHeader>
          <div className="mb-2 grid h-10 w-10 place-items-center rounded-xl bg-indigo-50 text-indigo-600">
            <ClipboardPlus className="h-5 w-5" />
          </div>
          <DialogTitle className="text-lg font-bold text-slate-900">Add participant field</DialogTitle>
          <DialogDescription>
            Ask participants for an additional piece of information, such as registration number or class.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="quiz-input-name">Field name</Label>
            <Input
              id="quiz-input-name"
              value={text}
              onChange={(event) => {
                setText(event.target.value);
                setFormError("");
              }}
              placeholder="e.g. Registration number"
              className="h-11 rounded-xl"
              autoFocus
            />
            {formError && (
              <p role="alert" className="text-sm text-rose-600">
                {formError}
              </p>
            )}
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button type="submit" disabled={!text.trim()} className="rounded-xl bg-indigo-600 hover:bg-indigo-700">
              Add field
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddQuizInputDialog;
