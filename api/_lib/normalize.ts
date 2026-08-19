import type { LabDetail, LabStage, LabSummary, LatLng } from "../../src/types";

/**
 * The upstream README documents request bodies (PascalCase, e.g. `Origin`,
 * `RadiusInMeters`) but does NOT show a JSON example of the search/detail
 * *responses*. These lookups try the likely casings so the app degrades
 * gracefully instead of silently mapping everything to undefined. Once you
 * hit the API for real, log a raw response and trim this to the fields that
 * actually come back.
 */
function field(obj: Record<string, unknown>, ...names: string[]): unknown {
  for (const name of names) {
    if (obj[name] !== undefined) return obj[name];
    const lower = name[0].toLowerCase() + name.slice(1);
    if (obj[lower] !== undefined) return obj[lower];
  }
  return undefined;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function toLatLng(value: unknown): LatLng | null {
  const rec = asRecord(value);
  const latitude = field(rec, "Latitude", "Lat");
  const longitude = field(rec, "Longitude", "Lng");
  if (typeof latitude === "number" && typeof longitude === "number") {
    return { latitude, longitude };
  }
  return null;
}

function normalizeStage(raw: unknown): LabStage {
  const rec = asRecord(raw);
  return {
    guid: String(field(rec, "Guid", "StageGuid") ?? ""),
    name: String(field(rec, "Name", "Title") ?? "Untitled stage"),
    hint: (field(rec, "Hint") as string | undefined) ?? null,
    location: toLatLng(field(rec, "Location", "Coordinates")),
  };
}

export function normalizeSummary(raw: unknown): LabSummary {
  const rec = asRecord(raw);
  return {
    guid: String(field(rec, "Guid", "AdventureGuid") ?? ""),
    title: String(field(rec, "Title", "Name") ?? "Untitled adventure"),
    description: String(field(rec, "Description") ?? ""),
    location: toLatLng(field(rec, "Location", "Origin")) ?? { latitude: 0, longitude: 0 },
    ownerName: String(field(rec, "OwnerName", "Owner") ?? "Unknown"),
    rating: (field(rec, "AverageRating", "Rating") as number | undefined) ?? null,
    numberOfStages: (field(rec, "NumberOfStages", "StageCount") as number | undefined) ?? null,
  };
}

export function normalizeDetail(raw: unknown): LabDetail {
  const rec = asRecord(raw);
  const stagesRaw = field(rec, "Stages", "Waypoints");
  const stages = Array.isArray(stagesRaw) ? stagesRaw.map(normalizeStage) : [];
  return { ...normalizeSummary(raw), stages };
}
