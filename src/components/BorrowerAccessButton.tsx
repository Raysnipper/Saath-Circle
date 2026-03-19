"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";

export function BorrowerAccessButton({
  loanId,
  borrowerEmail,
}: {
  loanId: string;
  borrowerEmail: string;
}) {
  const { data: session } = useSession();

  async function handleContinue() {
    await signIn(
      "google",
      { callbackUrl: `/loan/${loanId}` },
      {
        prompt: "select_account",
        login_hint: borrowerEmail,
      }
    );
  }

  async function handleSignOutFirst() {
    await signOut({
      callbackUrl: `/acknowledge/${loanId}`,
    });
  }

  if (session?.user?.email && session.user.email !== borrowerEmail) {
    return (
      <Button variant="outline" onClick={handleSignOutFirst}>
        Sign Out And Continue
      </Button>
    );
  }

  return <Button onClick={handleContinue}>Continue With Borrower Google</Button>;
}
