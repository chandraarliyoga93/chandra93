"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { MessageText } from "iconoir-react";
import { cn } from "@/lib/utils";

interface FeedbackButtonProps {
  studentName: string;
  feedback: string;
  onChange: (feedback: string) => void;
}

export function FeedbackButton({
  studentName,
  feedback,
  onChange,
}: FeedbackButtonProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [localFeedback, setLocalFeedback] = useState(feedback);

  const hasFeedback = feedback && feedback.length > 0;

  const handleOpenChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (open) {
      setLocalFeedback(feedback);
    }
  };

  const handleSave = () => {
    onChange(localFeedback);
    setIsDialogOpen(false);
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-8 w-8 transition-colors",
            hasFeedback
              ? "text-primary hover:text-primary/90"
              : "text-muted-foreground/30 hover:text-muted-foreground"
          )}
        >
          <MessageText className={cn("h-4 w-4", hasFeedback && "fill-current")} />
          <span className="sr-only">Feedback untuk {studentName}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Feedback untuk {studentName}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Textarea
            placeholder="Berikan catatan atau feedback..."
            value={localFeedback}
            onChange={(e) => setLocalFeedback(e.target.value)}
            className="min-h-[120px] resize-none"
          />
        </div>
        <DialogFooter>
          <Button onClick={handleSave}>Simpan Feedback</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
