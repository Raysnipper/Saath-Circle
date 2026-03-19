import nodemailer from "nodemailer";
import { getOptionalEnv, warnMissingEnv } from "@/lib/env";

type BorrowerNotificationInput = {
  borrowerEmail: string;
  borrowerName?: string | null;
  lenderName?: string | null;
  lenderEmail?: string | null;
  loanId: string;
  loanTitle: string;
  amount: number;
};

type LenderAcknowledgementInput = {
  lenderEmail: string;
  lenderName?: string | null;
  borrowerName?: string | null;
  borrowerEmail?: string | null;
  loanId: string;
  loanTitle: string;
  amount: number;
};

type LenderRepaymentInput = {
  lenderEmail: string;
  lenderName?: string | null;
  borrowerName?: string | null;
  borrowerEmail?: string | null;
  loanId: string;
  loanTitle: string;
  repaymentAmount: number;
  outstandingAmount: number;
};

type EmailResult = { sent: true } | { sent: false; reason: string };

function getBaseUrl() {
  return getOptionalEnv("NEXTAUTH_URL") || "http://localhost:3000";
}

function getTransportConfig() {
  const host = getOptionalEnv("SMTP_HOST");
  const port = getOptionalEnv("SMTP_PORT");
  const user = getOptionalEnv("SMTP_USER");
  const pass = getOptionalEnv("SMTP_PASS");
  const from = getOptionalEnv("SMTP_FROM");

  if (!host || !port || !user || !pass || !from) {
    for (const key of ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS", "SMTP_FROM"]) {
      if (!getOptionalEnv(key)) {
        warnMissingEnv(key, "email");
      }
    }

    return null;
  }

  return {
    host,
    port: Number(port),
    secure: Number(port) === 465,
    auth: {
      user,
      pass,
    },
    from,
  };
}

async function sendEmail({
  to,
  subject,
  text,
  html,
}: {
  to: string;
  subject: string;
  text: string;
  html: string;
}): Promise<EmailResult> {
  const config = getTransportConfig();

  if (!config) {
    return {
      sent: false,
      reason: "Email notifications are not configured yet.",
    };
  }

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.auth,
  });

  try {
    await transporter.sendMail({
      from: config.from,
      to,
      subject,
      text,
      html,
    });

    console.info(`[email] Sent "${subject}" to ${to}`);
    return { sent: true };
  } catch (error) {
    console.error(`[email] Failed to send "${subject}" to ${to}:`, error);

    return {
      sent: false,
      reason: "The action succeeded, but the email notification could not be sent.",
    };
  }
}

export async function sendBorrowerLoanNotification({
  borrowerEmail,
  borrowerName,
  lenderName,
  lenderEmail,
  loanId,
  loanTitle,
  amount,
}: BorrowerNotificationInput): Promise<EmailResult> {
  const acknowledgeUrl = `${getBaseUrl()}/acknowledge/${loanId}`;
  const borrowerDisplay = borrowerName || borrowerEmail;
  const lenderDisplay = lenderName || lenderEmail || "Someone";

  return sendEmail({
    to: borrowerEmail,
    subject: `${lenderDisplay} asked you to acknowledge a loan on DM Loan`,
    text: [
      `Hi ${borrowerDisplay},`,
      "",
      `${lenderDisplay} recorded a loan for INR ${amount.toFixed(2)}${loanTitle ? ` (${loanTitle})` : ""}.`,
      "Please review and acknowledge it in DM Loan.",
      "",
      `Open this link to sign in and review the loan: ${acknowledgeUrl}`,
    ].join("\n"),
    html: `
      <div style="font-family: Georgia, serif; line-height: 1.6; color: #1f1f1f;">
        <p>Hi ${borrowerDisplay},</p>
        <p><strong>${lenderDisplay}</strong> recorded a loan for <strong>INR ${amount.toFixed(2)}</strong>${loanTitle ? ` (${loanTitle})` : ""}.</p>
        <p>Please review and acknowledge it in DM Loan.</p>
        <p>
          <a href="${acknowledgeUrl}" style="display:inline-block;padding:12px 18px;background:#111;color:#fff;text-decoration:none;border-radius:999px;">
            Review Loan
          </a>
        </p>
        <p style="color:#666;font-size:14px;">If the button does not work, open this link:<br />${acknowledgeUrl}</p>
      </div>
    `,
  });
}

export async function sendLenderAcknowledgementNotification({
  lenderEmail,
  lenderName,
  borrowerName,
  borrowerEmail,
  loanId,
  loanTitle,
  amount,
}: LenderAcknowledgementInput): Promise<EmailResult> {
  const loanUrl = `${getBaseUrl()}/loan/${loanId}`;
  const lenderDisplay = lenderName || lenderEmail;
  const borrowerDisplay = borrowerName || borrowerEmail || "Your borrower";

  return sendEmail({
    to: lenderEmail,
    subject: `${borrowerDisplay} acknowledged your loan on DM Loan`,
    text: [
      `Hi ${lenderDisplay},`,
      "",
      `${borrowerDisplay} acknowledged the loan ${loanTitle ? `"${loanTitle}"` : ""} for INR ${amount.toFixed(2)}.`,
      `Review the loan here: ${loanUrl}`,
    ].join("\n"),
    html: `
      <div style="font-family: Georgia, serif; line-height: 1.6; color: #1f1f1f;">
        <p>Hi ${lenderDisplay},</p>
        <p><strong>${borrowerDisplay}</strong> acknowledged the loan${loanTitle ? ` <strong>${loanTitle}</strong>` : ""} for <strong>INR ${amount.toFixed(2)}</strong>.</p>
        <p>
          <a href="${loanUrl}" style="display:inline-block;padding:12px 18px;background:#111;color:#fff;text-decoration:none;border-radius:999px;">
            View Loan
          </a>
        </p>
      </div>
    `,
  });
}

export async function sendLenderRepaymentNotification({
  lenderEmail,
  lenderName,
  borrowerName,
  borrowerEmail,
  loanId,
  loanTitle,
  repaymentAmount,
  outstandingAmount,
}: LenderRepaymentInput): Promise<EmailResult> {
  const loanUrl = `${getBaseUrl()}/loan/${loanId}`;
  const lenderDisplay = lenderName || lenderEmail;
  const borrowerDisplay = borrowerName || borrowerEmail || "Your borrower";

  return sendEmail({
    to: lenderEmail,
    subject: `${borrowerDisplay} recorded a repayment on DM Loan`,
    text: [
      `Hi ${lenderDisplay},`,
      "",
      `${borrowerDisplay} recorded a repayment of INR ${repaymentAmount.toFixed(2)}${loanTitle ? ` toward ${loanTitle}` : ""}.`,
      `Outstanding after confirmation would be INR ${outstandingAmount.toFixed(2)}.`,
      `Review and confirm it here: ${loanUrl}`,
    ].join("\n"),
    html: `
      <div style="font-family: Georgia, serif; line-height: 1.6; color: #1f1f1f;">
        <p>Hi ${lenderDisplay},</p>
        <p><strong>${borrowerDisplay}</strong> recorded a repayment of <strong>INR ${repaymentAmount.toFixed(2)}</strong>${loanTitle ? ` toward <strong>${loanTitle}</strong>` : ""}.</p>
        <p>Outstanding after confirmation would be <strong>INR ${outstandingAmount.toFixed(2)}</strong>.</p>
        <p>
          <a href="${loanUrl}" style="display:inline-block;padding:12px 18px;background:#111;color:#fff;text-decoration:none;border-radius:999px;">
            Review Repayment
          </a>
        </p>
      </div>
    `,
  });
}
