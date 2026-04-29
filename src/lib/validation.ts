import { z } from "zod";
import { normalizeEmail } from "@/lib/invitations";

const moneyPattern = /^\d+(\.\d{1,2})?$/;

function moneyString(fieldName: string) {
  return z
    .union([z.string(), z.number()])
    .transform((value) => String(value).trim())
    .refine((value) => moneyPattern.test(value), {
      message: `${fieldName} must be a positive amount with up to 2 decimals`,
    })
    .refine((value) => Number(value) > 0, {
      message: `${fieldName} must be greater than 0`,
    })
    .refine((value) => Number(value) <= 99_999_999.99, {
      message: `${fieldName} is too large`,
    });
}

export const createLoanSchema = z.object({
  amount: moneyString("Amount"),
  title: z
    .string()
    .trim()
    .max(80, "The story must be 80 characters or fewer")
    .optional()
    .transform((value) => value || "Shared Record"),
  borrowerEmail: z
    .string()
    .trim()
    .email("Enter a valid email address")
    .transform(normalizeEmail),
});

export const createRepaymentSchema = z.object({
  amount: moneyString("Repayment amount"),
});

export const reviewTransactionSchema = z.object({
  transactionId: z.string().min(1, "Transaction is required"),
  status: z.enum(["CONFIRMED", "REJECTED"]),
});
