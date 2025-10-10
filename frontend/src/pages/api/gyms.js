import { getAllGyms } from "../../../lib/gymLocator";

const buildFiltersPayload = (filters) => ({
  city: filters.city ?? null,
  lat: typeof filters.lat === "number" ? filters.lat : null,
  lng: typeof filters.lng === "number" ? filters.lng : null,
  limit: typeof filters.limit === "number" ? filters.limit : null,
  max_distance_km:
    typeof filters.maxDistanceKm === "number" ? Number.parseFloat(filters.maxDistanceKm.toFixed(2)) : null,
});

const handler = async (req, res) => {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const {
      lat,
      lng,
      city,
      limit,
      max_distance_km: maxDistanceKm,
      maxDistanceKm: camelMaxDistance,
    } = req.query ?? {};

    const firstValue = (value) => {
      if (Array.isArray(value)) {
        return value[0];
      }
      return value;
    };

    const parseFloatSafe = (value) => {
      const candidate = firstValue(value);
      if (typeof candidate === "string" && candidate.trim().length > 0) {
        const parsed = Number.parseFloat(candidate);
        return Number.isNaN(parsed) ? undefined : parsed;
      }
      if (typeof candidate === "number" && Number.isFinite(candidate)) {
        return candidate;
      }
      return undefined;
    };

    const parseIntSafe = (value) => {
      const candidate = firstValue(value);
      if (typeof candidate === "string" && candidate.trim().length > 0) {
        const parsed = Number.parseInt(candidate, 10);
        return Number.isNaN(parsed) ? undefined : parsed;
      }
      if (typeof candidate === "number" && Number.isFinite(candidate)) {
        return Math.trunc(candidate);
      }
      return undefined;
    };

    const parsedFilters = {
      city: firstValue(city),
      lat: parseFloatSafe(lat),
      lng: parseFloatSafe(lng),
      limit: parseIntSafe(limit),
      maxDistanceKm:
        parseFloatSafe(maxDistanceKm) ??
        parseFloatSafe(camelMaxDistance) ??
        undefined,
    };

    const data = await getAllGyms(parsedFilters);

    res.setHeader("Cache-Control", "s-maxage=900, stale-while-revalidate=1800");
    res.status(200).json({
      gyms: data.gyms,
      available_cities: data.availableCities,
      count: data.count,
      total: data.total,
      filters: buildFiltersPayload(data.filters),
      served_from: data.servedFrom,
    });
  } catch (error) {
    globalThis.console?.error?.("Unable to fetch gyms", error);
    res.status(500).json({ error: "Unable to fetch gyms" });
  }
};

export default handler;
