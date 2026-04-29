import { Prisma } from "@prisma/client";

export type MoneyLike = number | string | Prisma.Decimal;

export function moneyToNumber(value: MoneyLike) {
  return Number(value);
}

export function formatCurrency(amount: MoneyLike, fractionDigits = 2) {
  return `\u20B9${moneyToNumber(amount).toFixed(fractionDigits)}`;
}

export function toClientLoanAmount<T extends { amount: MoneyLike }>(value: T) {
  return {
    ...value,
    amount: moneyToNumber(value.amount),
  };
}
