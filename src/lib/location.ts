export type Coordinates = {
  lat: number;
  lng: number;
};

export type LocationDetails = Coordinates & {
  address: string;
};

type LocationCarrier = {
  lat?: string;
  lng?: string;
  address?: string;
};

const LAGOS_CENTER: Coordinates = { lat: 6.5244, lng: 3.3792 };

export function getFallbackLocation(): LocationDetails {
  return {
    ...LAGOS_CENTER,
    address: "Lagos, Nigeria",
  };
}

export function getStoredLocation(details?: LocationCarrier | null): LocationDetails | null {
  if (!details?.address) return null;
  const lat = Number(details.lat);
  const lng = Number(details.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng, address: details.address };
}

export function getCurrentCoordinates(): Promise<Coordinates> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("Location services are not available in this browser"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      () => reject(new Error("We could not access your location")),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  });
}

export async function reverseGeocode(coords: Coordinates): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const params = new URLSearchParams({
      format: "jsonv2",
      lat: String(coords.lat),
      lon: String(coords.lng),
    });
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${params}`, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    if (!response.ok) return "Current location";
    const data = (await response.json()) as { display_name?: string };
    return data.display_name ?? "Current location";
  } catch {
    return "Current location";
  } finally {
    clearTimeout(timeout);
  }
}

export async function getCurrentLocationDetails(): Promise<LocationDetails> {
  const coords = await getCurrentCoordinates();
  const address = await reverseGeocode(coords);
  return { ...coords, address };
}

export async function getPreferredLocationDetails(details?: LocationCarrier | null): Promise<LocationDetails> {
  const stored = getStoredLocation(details);
  if (stored) return stored;
  try {
    return await getCurrentLocationDetails();
  } catch {
    return getFallbackLocation();
  }
}

export function shortLocationLabel(address: string): string {
  const compact = address
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 2)
    .join(", ");
  return compact || "Current location";
}

export function distanceKm(a: Coordinates, b: Coordinates): number {
  const earthRadiusKm = 6371;
  const toRad = (value: number) => (value * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(km < 10 ? 1 : 0)} km`;
}

export function restaurantCoords(row: { lat?: string; lng?: string }): Coordinates | null {
  const lat = Number(row.lat);
  const lng = Number(row.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}
