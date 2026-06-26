const PICKUP_OFFSET_MINUTES = 20;

export function defaultPickupTime() {
  return new Date(Date.now() + PICKUP_OFFSET_MINUTES * 60_000);
}

export function pickupTimingLabel(value: string | Date) {
  const pickup = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(pickup.getTime())) return "Pickup time pending";

  const diffMinutes = Math.round((pickup.getTime() - Date.now()) / 60_000);
  if (diffMinutes > 1) return `Picking in ${diffMinutes} minutes`;
  if (diffMinutes === 1) return "Picking in 1 minute";
  if (diffMinutes > -5) return "Picking now";
  return `Pickup was ${Math.abs(diffMinutes)} minutes ago`;
}
