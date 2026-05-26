export const naira = (n: number | string) =>
  "₦" + Number(n).toLocaleString("en-NG", { maximumFractionDigits: 0 });
