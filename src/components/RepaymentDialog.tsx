"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
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

export function RepaymentDialog({
  loanId,
  outstanding,
  counterpartyName,
}: {
  loanId: string;
  outstanding: number;
  counterpartyName: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`/api/loans/${loanId}/transactions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ amount }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to record repayment");
      }

      toast.success("Repayment recorded", {
        description: data.notification?.sent
          ? `A review email has been sent to ${counterpartyName}.`
          : "Repayment saved and is awaiting lender confirmation.",
      });

      setAmount("");
      setOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to record repayment"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" variant="outline" className="w-full" />}>
        Record Repayment
      </DialogTrigger>
      <DialogContent className="sm:max-w-[440px] border-white/70 bg-background/95 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="font-brand text-3xl font-semibold">
            Record a repayment
          </DialogTitle>
          <DialogDescription>
            Partial repayments are supported. This request will be sent to{" "}
            <span className="font-semibold text-foreground">{counterpartyName}</span>{" "}
            for approval.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-2xl border border-sky-200/60 bg-sky-50/60 p-4">
          <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Sending To
          </div>
          <div className="mt-2 text-lg font-semibold text-foreground">
            {counterpartyName}
          </div>
          <div className="mt-3 text-sm text-muted-foreground">
            Outstanding balance: {"\u20B9"}
            {outstanding.toFixed(2)}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="repayment-amount">Repayment amount</Label>
            <Input
              id="repayment-amount"
              name="amount"
              type="number"
              min="0.01"
              max={outstanding}
              step="0.01"
              placeholder="100.00"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              required
            />
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Send For Review"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
