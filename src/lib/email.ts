import nodemailer from "nodemailer";
import { getOptionalEnv, warnMissingEnv } from "@/lib/env";

type BorrowerNotificationInput = {
  borrowerEmail: string;
  borrowerName?: string | null;
  lenderName?: string | null;
  lenderEmail?: string | null;
  inviteToken: string;
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

function capitalizeName(name: string) {
  return name
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function formatMoney(amount: number) {
  return `INR ${amount.toFixed(2)}`;
}

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

function renderEmailShell({
  eyebrow,
  title,
  body,
  ctaUrl,
  ctaLabel,
  footer,
}: {
  eyebrow: string;
  title: string;
  body: string;
  ctaUrl: string;
  ctaLabel: string;
  footer?: string;
}) {
  return `
    <div style="margin:0;padding:0;background:#fbf9f6;color:#2f1f21;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;background:#fbf9f6;">
        <tr>
          <td align="center" style="padding:32px 16px;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;border-collapse:collapse;background:#fffdf9;border:1px solid #eaded7;border-radius:24px;overflow:hidden;box-shadow:0 16px 42px rgba(75,38,42,0.10);">
              <tr>
                <td style="padding:26px 28px 18px;background:#4b2028;color:#fffdf9;">
                  <div style="font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#f2c7bd;">Saath Circle</div>
                  <div style="margin-top:16px;font-family:Georgia,'Times New Roman',serif;font-size:30px;line-height:1.1;font-weight:700;">${title}</div>
                  <div style="margin-top:10px;font-family:Arial,Helvetica,sans-serif;font-size:13px;letter-spacing:0.08em;text-transform:uppercase;color:#f7ddd4;">${eyebrow}</div>
                </td>
              </tr>
              <tr>
                <td style="padding:28px;font-family:Georgia,'Times New Roman',serif;font-size:18px;line-height:1.65;color:#2f1f21;">
                  ${body}
                  <div style="margin-top:28px;">
                    <a href="${ctaUrl}" style="display:inline-block;padding:14px 22px;background:#4b2028;color:#fffdf9;text-decoration:none;border-radius:999px;font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;">
                      ${ctaLabel}
                    </a>
                  </div>
                  <div style="margin-top:26px;padding-top:18px;border-top:1px solid #eaded7;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.5;color:#7a6662;">
                    ${footer || `If the button does not work, open this link:<br /><a href="${ctaUrl}" style="color:#4b2028;">${ctaUrl}</a>`}
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>
  `;
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
  inviteToken,
  loanTitle,
  amount,
}: BorrowerNotificationInput): Promise<EmailResult> {
  const acknowledgeUrl = `${getBaseUrl()}/invite/${inviteToken}`;
  const borrowerDisplay = borrowerName ? capitalizeName(borrowerName) : borrowerEmail;
  const senderDisplay = lenderName ? capitalizeName(lenderName) : lenderEmail || "Someone";

  return sendEmail({
    to: borrowerEmail,
    subject: `${senderDisplay} sent you a handshake on Saath Circle`,
    text: [
      `Hi ${borrowerDisplay},`,
      "",
      `${senderDisplay} recorded a handshake with you for ${formatMoney(amount)}${loanTitle ? ` (${loanTitle})` : ""}.`,
      "Please sign in with the invited Google account to review and acknowledge it in Saath Circle.",
      "",
      `Open this link to review the handshake: ${acknowledgeUrl}`,
    ].join("\n"),
    html: renderEmailShell({
      eyebrow: "Private handshake invitation",
      title: "Review a handshake",
      ctaUrl: acknowledgeUrl,
      ctaLabel: "Review Handshake",
      body: `
        <p style="margin:0 0 14px;">Hi ${borrowerDisplay},</p>
        <p style="margin:0 0 14px;"><strong>${senderDisplay}</strong> recorded a handshake with you for <strong>${formatMoney(amount)}</strong>${loanTitle ? ` (${loanTitle})` : ""}.</p>
        <p style="margin:0;">Please sign in with the invited Google account to review and acknowledge it in Saath Circle.</p>
      `,
    }),
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
  const recipientDisplay = lenderName ? capitalizeName(lenderName) : lenderEmail;
  const borrowerDisplay = borrowerName ? capitalizeName(borrowerName) : borrowerEmail || "Your borrower";

  return sendEmail({
    to: lenderEmail,
    subject: `${borrowerDisplay} acknowledged your handshake on Saath Circle`,
    text: [
      `Hi ${recipientDisplay},`,
      "",
      `${borrowerDisplay} acknowledged the handshake ${loanTitle ? `"${loanTitle}"` : ""} for ${formatMoney(amount)}.`,
      `Review the handshake here: ${loanUrl}`,
    ].join("\n"),
    html: renderEmailShell({
      eyebrow: "Handshake acknowledged",
      title: "Your handshake is active",
      ctaUrl: loanUrl,
      ctaLabel: "View Handshake",
      body: `
        <p style="margin:0 0 14px;">Hi ${recipientDisplay},</p>
        <p style="margin:0;"><strong>${borrowerDisplay}</strong> acknowledged the handshake${loanTitle ? ` <strong>${loanTitle}</strong>` : ""} for <strong>${formatMoney(amount)}</strong>.</p>
      `,
    }),
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
  const recipientDisplay = lenderName ? capitalizeName(lenderName) : lenderEmail;
  const borrowerDisplay = borrowerName ? capitalizeName(borrowerName) : borrowerEmail || "Your borrower";

  return sendEmail({
    to: lenderEmail,
    subject: `${borrowerDisplay} recorded a repayment on Saath Circle`,
    text: [
      `Hi ${recipientDisplay},`,
      "",
      `${borrowerDisplay} recorded a repayment of ${formatMoney(repaymentAmount)}${loanTitle ? ` toward ${loanTitle}` : ""}.`,
      `Outstanding after confirmation would be ${formatMoney(outstandingAmount)}.`,
      `Review and confirm it here: ${loanUrl}`,
    ].join("\n"),
    html: renderEmailShell({
      eyebrow: "Repayment review",
      title: "A repayment needs review",
      ctaUrl: loanUrl,
      ctaLabel: "Review Repayment",
      body: `
        <p style="margin:0 0 14px;">Hi ${recipientDisplay},</p>
        <p style="margin:0 0 14px;"><strong>${borrowerDisplay}</strong> recorded a repayment of <strong>${formatMoney(repaymentAmount)}</strong>${loanTitle ? ` toward <strong>${loanTitle}</strong>` : ""}.</p>
        <p style="margin:0;">Outstanding after confirmation would be <strong>${formatMoney(outstandingAmount)}</strong>.</p>
      `,
    }),
  });
}

export type NudgeNotificationInput = {
  receiverEmail: string;
  receiverName?: string | null;
  senderName?: string | null;
  senderEmail?: string | null;
  loanId: string;
  loanTitle?: string | null;
  amount: number;
};

export async function sendNudgeNotification({
  receiverEmail,
  receiverName,
  senderName,
  senderEmail,
  amount,
  loanTitle,
}: NudgeNotificationInput): Promise<EmailResult> {
  const baseUrl = getBaseUrl();
  const receiverDisplay = receiverName ? capitalizeName(receiverName) : receiverEmail;
  const senderDisplay = senderName ? capitalizeName(senderName) : senderEmail || "Someone";

  return sendEmail({
    to: receiverEmail,
    subject: `${senderDisplay} sent you a virtual chai on Saath Circle`,
    text: [
      `Hi ${receiverDisplay},`,
      "",
      `${senderDisplay} just nudged you regarding the handshake for ${formatMoney(amount)}${loanTitle ? ` (${loanTitle})` : ""}.`,
      "Head over to Saath Circle to review your active bonds.",
      "",
      `Open this link: ${baseUrl}`,
    ].join("\n"),
    html: renderEmailShell({
      eyebrow: "Gentle check-in",
      title: "A Saath Circle nudge",
      ctaUrl: baseUrl,
      ctaLabel: "Open Saath Circle",
      body: `
        <p style="margin:0 0 14px;">Hi ${receiverDisplay},</p>
        <p style="margin:0 0 14px;"><strong>${senderDisplay}</strong> sent you a virtual chai about your active bond for <strong>${formatMoney(amount)}</strong>${loanTitle ? ` (${loanTitle})` : ""}.</p>
        <p style="margin:0;">Head over to Saath Circle to review your active bonds.</p>
      `,
    }),
  });
}
