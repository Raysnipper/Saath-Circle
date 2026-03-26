"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoanForm() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const title = formData.get("title") as string;
    const amount = formData.get("amount") as string;
    const borrowerEmail = formData.get("borrowerEmail") as string;

    try {
      const res = await fetch("/api/loans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, amount, borrowerEmail }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create record");
      }

      const data = await res.json();

      if (data.notification?.sent) {
        toast.success("Record added", {
          description: "A review email has been sent to the other person.",
        });
      } else {
        toast.warning("Record added", {
          description:
            data.notification?.reason ||
            "The record was saved, but the email could not be sent.",
        });
      }

      setOpen(false);
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to create record";

      toast.error("Could not save", {
        description: message,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="bg-primary text-on-primary px-6 py-3 sm:py-2.5 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-widest hover:scale-105 hover:bg-primary-container hover:text-primary hover:shadow-md transition-all flex items-center gap-2">
        <Plus className="h-4 w-4" strokeWidth={3} /> ADD RECORD
      </DialogTrigger>
      <DialogContent className="sm:max-w-[470px] dashboard-card border-none">
        <DialogHeader>
          <DialogTitle className="font-extrabold tracking-tighter text-3xl text-primary">
            Add a shared record
          </DialogTitle>
          <DialogDescription>
            Keep the context clear so the right person can review it without any
            awkward back-and-forth.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="borrowerEmail">Person&apos;s Email</Label>
            <Input
              id="borrowerEmail"
              name="borrowerEmail"
              type="email"
              placeholder="friend@example.com"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (INR)</Label>
            <Input
              id="amount"
              name="amount"
              type="number"
              placeholder="1000"
              min="1"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="title">Context (Optional)</Label>
            <Input
              id="title"
              name="title"
              type="text"
              placeholder="Dinner, rent split, tickets..."
            />
          </div>
          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Record"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
