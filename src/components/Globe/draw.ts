import { geoDistance, geoPath, type GeoPermissibleObjects, type GeoProjection } from 'd3-geo';
import type { Mark, MarkVariant } from '../App/markers';
import { applyOpacity } from './utils';

export const drawMark = (
  context: CanvasRenderingContext2D,
  position: [number, number],
  variant: MarkVariant,
  opacity: number = 0,
  dpr: number = 1
) => {
  if (variant === 'none' || opacity === 0) return;
  const [x, y] = position;
  context.beginPath();
  switch (variant) {
    case 'dot':
      context.fillStyle = applyOpacity('#AF3838', opacity);
      context.strokeStyle = applyOpacity('#ffffff', opacity);
      context.lineWidth = 2 * dpr;
      context.arc(x, y, 4 * dpr, 0, Math.PI * 2);
      context.fill();
      context.stroke();
  }
};

// TODO: Clean this function up.
export const drawLabel = (
  context: CanvasRenderingContext2D,
  projection: GeoProjection,
  label: Mark,
  opacity: number = 0,
  dpr: number = 1
) => {
  const labelLevel1 = (label: Mark) => {
    const position = projection(label.center);

    // Quit early if the label center isn't valid
    if (!position) return;

    const fontSize = 15 * dpr;

    // Set this before measuring
    context.font = `400 ${fontSize}px ABCSans`;

    const [x, y] = position;

    context.textBaseline = 'middle';
    context.textAlign = 'center';
    context.fillStyle = applyOpacity('#000000', opacity);
    context.strokeStyle = applyOpacity('#ffffff', opacity * 0.75);
    context.miterLimit = 3;
    context.lineWidth = 3 * dpr;
    context.strokeText(label.label.toUpperCase(), x, y);
    context.fillText(label.label.toUpperCase(), x, y);
  };
  const labelLevel2 = (label: Mark) => {
    const position = projection(label.center);

    // Quit early if the label center isn't valid
    if (!position) return;

    const fontSize = 13 * dpr;

    // Set this before measuring
    context.font = `700 ${fontSize}px ABCSans`;
    const labelTextWidth = context.measureText(label.label).width;
    const [x, y] = position;

    context.textBaseline = 'middle';
    context.textAlign = 'center';
    context.fillStyle = applyOpacity('#000000', opacity);
    context.strokeStyle = applyOpacity('#ffffff', opacity * 0.75);
    context.lineWidth = 3 * dpr;
    context.strokeText(label.label, x + labelTextWidth / 2 + 15, y);
    context.fillText(label.label, x + labelTextWidth / 2 + 15, y);
  };
  const labelLevel3 = (label: Mark) => {
    const position = projection(label.center);

    // Quit early if the label center isn't valid
    if (!position) return;

    const fontSize = 14 * dpr;
    const labelTextOffset = 10 * dpr;
    const labelTextPadding = 10 * dpr;

    // Set this before measuring
    context.font = `700 ${fontSize}px ABCSans`;
    const labelTextWidth = context.measureText(label.label).width;
    const [x, y] = position;

    context.beginPath();
    context.moveTo(x + labelTextOffset, y - fontSize);
    context.lineTo(x + labelTextOffset + labelTextWidth + labelTextPadding * 2, y - fontSize);
    context.lineTo(x + labelTextOffset + labelTextWidth + labelTextPadding * 2, y + fontSize);
    context.lineTo(x + labelTextOffset, y + fontSize);
    context.lineTo(x + labelTextOffset / 3, y);
    context.closePath();
    context.fillStyle = `rgba(237, 240, 242, ${opacity})`;
    context.fill();

    // Draw label
    context.fillStyle = applyOpacity('#000000', opacity);
    context.textAlign = 'left';
    context.fillText(label.label, x + labelTextOffset + labelTextPadding, y + fontSize * 0.6);
  };

  const inversePosition = (): [number, number] => {
    return [-projection.rotate()[0], -projection.rotate()[1]];
  };

  // Don't print labels on the other side of the world
  if (geoDistance(label.center, inversePosition()) > 1.5707963267949) return;

  switch (label.labelVariant) {
    case 'country':
      return labelLevel1(label);
    case 'city':
      return labelLevel2(label);
    case 'sea':
      return labelLevel3(label);
  }
};

type PathStyles = {
  strokeStyle?: string;
  fillStyle?: string;
  lineWidth?: number;
};

export const drawPath = (
  context: CanvasRenderingContext2D,
  path: ReturnType<typeof geoPath>,
  styles: PathStyles,
  geojson: GeoPermissibleObjects
) => {
  context.beginPath();
  let stroke = false;
  let fill = false;
  for (let key in styles) {
    context[key] = styles[key];
    if (key.startsWith('fill')) fill = true;
    if (key.startsWith('stroke')) stroke = true;
  }
  path(geojson);
  if (fill) context.fill();
  if (stroke) context.stroke();
};
