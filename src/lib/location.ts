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

export function getStoredLocation(details?: LocationCarrier | null): LocationDetails | null {
  if (!details?.address) return null;
  const lat = Number(details.lat);
  const lng = Number(details.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  const address = isGenericLocationName(details.address)
    ? coordinateLocationName({ lat, lng })
    : details.address;
  return { lat, lng, address };
}

export function coordinateLocationName(coords: Coordinates): string {
  return `Pinned area ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`;
}

function isGenericLocationName(address?: string): boolean {
  if (!address) return true;
  return ["current location", "location", "pinned location"].includes(address.trim().toLowerCase());
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
      (error) => {
        const message =
          error.code === error.PERMISSION_DENIED
            ? "Location is off. Turn it on for this browser, then tap refresh."
            : error.code === error.TIMEOUT
              ? "Location took too long. Move closer to a clear signal and try again."
              : "We could not read your exact location. Please try again.";
        reject(new Error(message));
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
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
    if (response.ok) {
      const data = (await response.json()) as { display_name?: string };
      if (data.display_name && !isGenericLocationName(data.display_name)) return data.display_name;
    }
  } catch {
    // Try the lighter public reverse-geocode endpoint below.
  } finally {
    clearTimeout(timeout);
  }

  const fallbackController = new AbortController();
  const fallbackTimeout = setTimeout(() => fallbackController.abort(), 5000);
  try {
    const params = new URLSearchParams({
      latitude: String(coords.lat),
      longitude: String(coords.lng),
      localityLanguage: "en",
    });
    const response = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?${params}`,
      {
        signal: fallbackController.signal,
        headers: { Accept: "application/json" },
      },
    );
    if (response.ok) {
      const data = (await response.json()) as {
        locality?: string;
        city?: string;
        principalSubdivision?: string;
        countryName?: string;
      };
      const label = [data.locality || data.city, data.principalSubdivision, data.countryName]
        .map((part) => part?.trim())
        .filter(Boolean)
        .join(", ");
      if (label) return label;
    }
  } catch {
    // The coordinate label is still better than a fake place name.
  } finally {
    clearTimeout(fallbackTimeout);
  }

  return coordinateLocationName(coords);
}

export async function getCurrentLocationDetails(): Promise<LocationDetails> {
  const coords = await getCurrentCoordinates();
  const address = await reverseGeocode(coords);
  return { ...coords, address };
}

export async function getPreferredLocationDetails(
  details?: LocationCarrier | null,
): Promise<LocationDetails> {
  const stored = getStoredLocation(details);
  if (stored) return stored;
  throw new Error("Location is not available");
}

export function shortLocationLabel(address: string): string {
  if (isGenericLocationName(address)) return "Location off";
  const compact = address
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 2)
    .join(", ");
  return compact || "Location off";
}

export function distanceKm(a: Coordinates, b: Coordinates): number {
  const earthRadiusKm = 6371;
  const toRad = (value: number) => (value * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export function formatDistance(km: number): string {
  if (km < 1) return `${Math.max(km, 0).toFixed(1)} km`;
  return `${km.toFixed(km < 10 ? 1 : 0)} km`;
}

export function restaurantCoords(row: { lat?: string; lng?: string }): Coordinates | null {
  const lat = Number(row.lat);
  const lng = Number(row.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}
