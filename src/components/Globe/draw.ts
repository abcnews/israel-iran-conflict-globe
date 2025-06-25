import { geoDistance, geoPath, type GeoPermissibleObjects, type GeoProjection } from 'd3-geo';
import type { Mark, MarkVariant } from '../App/markers';
import { applyOpacity } from './utils';

const strikeIconPath = new Path2D(
  'm5.36888.79542 1.7 6.36-5.72-1.98 4.54 4.1-5.540003 1.07998 5.320003 1.32-2.88 5.1 4.74-2.84.14 5.62 2.02-5.18 2.66002 3.98-.22-4.84 4.56 1.86-3.16-4.34 5.5-3.15998-6.22.32 1.8-3.8-3.42 2.5.4-5.5-2.40002 4.58z'
);

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
      context.lineWidth = 0.5 * dpr;
      context.arc(x, y, 5 * dpr, 0, Math.PI * 2);
      context.fill();
      context.stroke();
      return;
    case 'strike':
      context.fillStyle = applyOpacity('#FF571A', opacity);
      context.strokeStyle = applyOpacity('#ffffff', opacity * 0.75);
      context.lineWidth = 1.1;
      context.translate(x - 11 * dpr, y - 11 * dpr);
      context.scale(dpr, dpr);
      context.fill(strikeIconPath);
      context.stroke(strikeIconPath);
      context.resetTransform();
      return;
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

    const fontSize = 17 * dpr;

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

    const fontSize = 15 * dpr;

    // Set this before measuring
    context.font = `700 ${fontSize}px ABCSans`;
    const labelTextWidth = context.measureText(label.label).width;
    const [x, y] = position;

    context.textBaseline = 'middle';
    context.textAlign = 'center';
    context.fillStyle = applyOpacity('#000000', opacity);
    context.strokeStyle = applyOpacity('#ffffff', opacity * 0.75);
    context.lineWidth = 3 * dpr;
    context.strokeText(label.label, x + labelTextWidth / 2 + 15 * dpr, y);
    context.fillText(label.label, x + labelTextWidth / 2 + 15 * dpr, y);
  };
  const labelLevel3 = (label: Mark) => {
    const position = projection(label.center);

    // Quit early if the label center isn't valid
    if (!position) return;

    const fontSize = 16 * dpr;
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
