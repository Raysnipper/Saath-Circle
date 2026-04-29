"use client";

import { useState } from "react";
import { signIn, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function InviteAccessButton({
  token,
  invitedEmail,
  sessionEmail,
  canClaim,
}: {
  token: string;
  invitedEmail: string;
  sessionEmail?: string | null;
  canClaim: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function signInWithInvitedAccount() {
    await signIn(
      "google",
      { callbackUrl: `/invite/${token}` },
      {
        prompt: "select_account",
        login_hint: invitedEmail,
      }
    );
  }

  async function switchAccount() {
    await signOut({ callbackUrl: `/invite/${token}` });
  }

  async function claimInvite() {
    setLoading(true);

    try {
      const res = await fetch(`/api/invitations/${token}/claim`, {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Could not accept this invitation");
      }

      toast.success("Handshake unlocked", {
        description: "You can now review and acknowledge the record.",
      });
      router.push(`/loan/${data.loanId}`);
      router.refresh();
    } catch (error) {
      toast.error("Invite could not be accepted", {
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setLoading(false);
    }
  }

  if (!sessionEmail) {
    return (
      <Button onClick={signInWithInvitedAccount}>
        Continue With Google
      </Button>
    );
  }

  if (!canClaim) {
    return (
      <Button variant="outline" onClick={switchAccount}>
        Use A Different Google Account
      </Button>
    );
  }

  return (
    <Button onClick={claimInvite} disabled={loading}>
      {loading ? "Unlocking..." : "Review This Handshake"}
    </Button>
  );
}
