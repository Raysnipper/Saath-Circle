"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function AcknowledgeLoanButton({ loanId }: { loanId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleAcknowledge() {
    setLoading(true);

    try {
      const res = await fetch(`/api/loans/${loanId}/acknowledge`, {
        method: "POST",
      });

      if (!res.ok) {
        throw new Error("Failed to acknowledge");
      }

      toast.success("Loan acknowledged!");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to acknowledge"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button onClick={handleAcknowledge} disabled={loading} className="w-full sm:w-auto">
      {loading ? "Acknowledging..." : "Acknowledge Loan"}
    </Button>
  );
}
