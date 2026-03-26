"use client";

import { useState } from "react";
import { Coffee } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";

export function NudgeDialog({
  loanId,
  counterpartName,
  onNudged,
  children,
}: {
  loanId: string;
  counterpartName: string;
  onNudged: () => void;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const displayName = counterpartName.includes('@') ? counterpartName.split('@')[0] : counterpartName;

  const handleNudge = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/loans/${loanId}/nudge`, {
        method: "POST",
      });
      
      if (!res.ok) {
        throw new Error("Failed to send nudge");
      }
      
      localStorage.setItem(`saath-nudge-${loanId}`, Date.now().toString());
      
      toast.success("Virtual Chai sent!", {
        description: `We've nudged ${displayName} warmly.`,
      });
      
      setOpen(false);
      onNudged();
    } catch (e) {
      toast.error("Failed to brew chai", {
        description: "Please try again later.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {/* @ts-expect-error - asChild is an underlying Radix primitive prop but types might not be exported here */}
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px] border-none shadow-2xl p-0 overflow-hidden bg-[#FCDDBF] rounded-3xl">
        <div className="flex flex-col items-center justify-center text-center px-8 py-14 relative">
          <div className="relative z-10 w-full flex flex-col gap-6 items-center">
            <div className="text-[#2F1400]">
              <Coffee className="w-10 h-10" strokeWidth={2.5} />
            </div>
            
            <div className="space-y-3">
              <h3 className="text-[1.8rem] font-extrabold tracking-tighter text-[#2F1400] leading-none">
                Check-in with {displayName}
              </h3>
              <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#2F1400]/60">
                Send a virtual chai to keep it light
              </p>
            </div>
            
            <div className="w-full max-w-[240px] pt-4">
              <button
                onClick={handleNudge}
                disabled={isLoading}
                className="bg-[#2F1400] text-[#FCDDBF] px-8 py-4 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-[#4a2406] transition-all duration-300 w-full disabled:opacity-50 flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-105"
              >
                {isLoading ? "Brewing..." : "Send Nudge"}
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
