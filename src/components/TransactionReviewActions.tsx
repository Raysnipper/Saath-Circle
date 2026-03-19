"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function TransactionReviewActions({
  loanId,
  transactionId,
}: {
  loanId: string;
  transactionId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<"CONFIRMED" | "REJECTED" | null>(null);

  async function updateTransaction(status: "CONFIRMED" | "REJECTED") {
    setLoading(status);

    try {
      const res = await fetch(`/api/loans/${loanId}/transactions`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ transactionId, status }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to update repayment");
      }

      toast.success(
        status === "CONFIRMED" ? "Repayment confirmed" : "Repayment rejected"
      );
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update repayment"
      );
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <Button
        size="sm"
        className="w-full sm:w-auto"
        onClick={() => updateTransaction("CONFIRMED")}
        disabled={loading !== null}
      >
        {loading === "CONFIRMED" ? "Confirming..." : "Confirm"}
      </Button>
      <Button
        size="sm"
        variant="outline"
        className="w-full sm:w-auto"
        onClick={() => updateTransaction("REJECTED")}
        disabled={loading !== null}
      >
        {loading === "REJECTED" ? "Rejecting..." : "Reject"}
      </Button>
    </div>
  );
}
