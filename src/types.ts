export interface LatLng {
  latitude: number;
  longitude: number;
}

export interface LabSummary {
  guid: string;
  title: string;
  description: string;
  location: LatLng;
  ownerName: string;
  rating: number | null;
  numberOfStages: number | null;
}

export interface LabStage {
  guid: string;
  name: string;
  hint: string | null;
  location: LatLng | null;
}

export interface LabDetail extends LabSummary {
  stages: LabStage[];
}

export interface SearchParams {
  latitude: number;
  longitude: number;
  radiusInMeters: number;
  take: number;
}
