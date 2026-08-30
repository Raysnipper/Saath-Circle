import { Prisma } from "@prisma/client";

export type MoneyLike = number | string | Prisma.Decimal;

export function moneyToNumber(value: MoneyLike) {
  return Number(value);
}

export function formatCurrency(
  amount: MoneyLike,
  options?: { showDecimals?: boolean } | number
) {
  const num = moneyToNumber(amount);
  let hasDecimals = num % 1 !== 0;
  if (typeof options === "number") {
    hasDecimals = options > 0;
  } else if (typeof options?.showDecimals === "boolean") {
    hasDecimals = options.showDecimals;
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: hasDecimals ? 2 : 0,
    minimumFractionDigits: hasDecimals ? 2 : 0,
  }).format(num);
}

export function toClientLoanAmount<T extends { amount: MoneyLike }>(value: T) {
  return {
    ...value,
    amount: moneyToNumber(value.amount),
  };
}
