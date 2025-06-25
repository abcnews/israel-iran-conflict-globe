import type { Feature } from 'geojson';
import rewind from '@mapbox/geojson-rewind';

export const rad2deg = (deg: number) => (deg * 180) / Math.PI;
export const applyOpacity = (hex: string, opacity: number) => {
  if (hex.length >= 8 || hex.length < 6) {
    throw new Error('Can only apply opacity to 6 character hex colour codes');
  }
  return `${hex}${Math.round(opacity * 255)
    .toString(16)
    .padStart(2, '0')}`;
};

export const splitMultiPolygon = (multiPolygonFeature: Feature): Feature[] => {
  if (multiPolygonFeature.type !== 'Feature' || multiPolygonFeature.geometry.type !== 'MultiPolygon') {
    throw new Error('Input must be a GeoJSON Feature with a MultiPolygon geometry');
  }

  return multiPolygonFeature.geometry.coordinates.map((coordinates, index) => ({
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates
    },
    properties: { ...multiPolygonFeature.properties, _part: index }
  }));
};

export const createViewPolygon = (coordinates: [number, number][]) => {
  return rewind(
    {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {},
          geometry: {
            coordinates: [[...coordinates, coordinates[0]]],
            type: 'Polygon'
          }
        }
      ]
    },
    true
  );
};
