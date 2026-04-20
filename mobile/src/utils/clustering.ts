import Supercluster from 'supercluster';
import type {BBox, LandMarker} from '../types';

export interface ClusterFeature {
  type: 'Feature';
  id: number | string;
  geometry: {
    type: 'Point';
    coordinates: [number, number]; // [lng, lat]
  };
  properties: {
    cluster: false;
    landId: string;
    minPrice: number;
    avgPricePerM2: number;
    totalListings: number;
    hasBoosted: boolean;
  };
}

export interface ClusterPoint {
  type: 'Feature';
  id: number;
  geometry: {
    type: 'Point';
    coordinates: [number, number];
  };
  properties: {
    cluster: true;
    cluster_id: number;
    point_count: number;
    point_count_abbreviated: string | number;
  };
}

export type ClusterItem = ClusterFeature | ClusterPoint;

let superclusterInstance: Supercluster | null = null;
let lastMarkersHash = '';

function buildInstance(markers: LandMarker[]): Supercluster {
  const instance = new Supercluster({
    radius: 60,
    maxZoom: 18,
    minZoom: 0,
    minPoints: 2,
  });

  const features: GeoJSON.Feature<
    GeoJSON.Point,
    ClusterFeature['properties']
  >[] = markers.map(marker => ({
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [marker.coordinates.longitude, marker.coordinates.latitude],
    },
    properties: {
      cluster: false,
      landId: marker.id,
      minPrice: marker.minPrice,
      avgPricePerM2: marker.avgPricePerM2,
      totalListings: marker.totalListings,
      hasBoosted: marker.hasBoosted,
    },
  }));

  instance.load(features);
  return instance;
}

/**
 * Cluster markers using supercluster.
 * Reuses the instance if marker data hasn't changed.
 */
export function clusterMarkers(
  markers: LandMarker[],
  zoom: number,
  bbox: BBox,
): ClusterItem[] {
  const markersHash = markers.map(m => m.id).join(',');

  if (markersHash !== lastMarkersHash || !superclusterInstance) {
    superclusterInstance = buildInstance(markers);
    lastMarkersHash = markersHash;
  }

  const clusterBbox: [number, number, number, number] = [
    bbox.west,
    bbox.south,
    bbox.east,
    bbox.north,
  ];

  const zoomLevel = Math.floor(zoom);

  return superclusterInstance.getClusters(
    clusterBbox,
    zoomLevel,
  ) as ClusterItem[];
}

/**
 * Get the leaves (individual markers) within a cluster.
 */
export function getClusterLeaves(
  clusterId: number,
  limit: number = 10,
): ClusterFeature[] {
  if (!superclusterInstance) return [];
  return superclusterInstance.getLeaves(clusterId, limit) as ClusterFeature[];
}

export function isCluster(item: ClusterItem): item is ClusterPoint {
  return item.properties.cluster === true;
}
