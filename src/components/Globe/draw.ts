import { geoDistance, geoPath, type GeoPermissibleObjects, type GeoProjection } from 'd3-geo';
import type { Mark } from '../App/markers';
// TODO: Clean this function up.
export const drawLabels = (context: CanvasRenderingContext2D, projection: GeoProjection, labels: Mark[]) => {
  const labelDefault = (label: Mark, index: number) => {
    const position = projection(label.center);

    // Quit early if the label center isn't valid
    if (!position) return;

    const fontSize = window.innerWidth < 500 ? 16 : 18;

    // Set this before measuring
    context.font = `700 ${fontSize}px ABCSans`;

    const [x, y] = position;

    const labelTextPadding = 18;
    const labelTextOffset = window.innerWidth < 500 ? 20 : 30;
    const labelTextWidth = context.measureText(label.label).width;

    context.textBaseline = 'bottom';

    if (window.innerWidth < 500) {
      if (index % 2 === 0) {
        // Top label
        context.beginPath();
        context.moveTo(x - (labelTextWidth + labelTextPadding * 2) / 2, y - labelTextOffset - fontSize * 2);
        context.lineTo(x + (labelTextWidth + labelTextPadding * 2) / 2, y - labelTextOffset - fontSize * 2);
        context.lineTo(x + (labelTextWidth + labelTextPadding * 2) / 2, y - labelTextOffset);
        context.lineTo(x + 5, y - labelTextOffset);
        context.lineTo(x, y - labelTextOffset * 0.3);
        context.lineTo(x - 5, y - labelTextOffset);
        context.lineTo(x - (labelTextWidth + labelTextPadding * 2) / 2, y - labelTextOffset);
        context.lineTo(x - (labelTextWidth + labelTextPadding * 2) / 2, y - labelTextOffset - fontSize * 2);
        context.closePath();
        context.fillStyle = '#000';
        context.fill();

        // Draw text
        context.fillStyle = '#fff';
        context.textAlign = 'center';
        context.fillText(label.label, x, y - labelTextOffset - fontSize * 0.2);
      } else {
        // Bottom label
        context.beginPath();
        context.moveTo(x - (labelTextWidth + labelTextPadding * 2) / 2, y + labelTextOffset + fontSize * 2);
        context.lineTo(x + (labelTextWidth + labelTextPadding * 2) / 2, y + labelTextOffset + fontSize * 2);
        context.lineTo(x + (labelTextWidth + labelTextPadding * 2) / 2, y + labelTextOffset);
        context.lineTo(x + 5, y + labelTextOffset);
        context.lineTo(x, y + labelTextOffset * 0.7);
        context.lineTo(x - 5, y + labelTextOffset);
        context.lineTo(x - (labelTextWidth + labelTextPadding * 2) / 2, y + labelTextOffset);
        context.lineTo(x - (labelTextWidth + labelTextPadding * 2) / 2, y + labelTextOffset + fontSize * 2);
        context.closePath();
        context.fillStyle = '#000';
        context.fill();

        // Draw text
        context.fillStyle = '#fff';
        context.textAlign = 'center';
        context.fillText(label.label, x, y + labelTextOffset + fontSize * 1.6);
      }
    } else {
      if (index % 2 === 0) {
        // Draw tag background
        context.beginPath();
        context.moveTo(x + labelTextOffset, y - fontSize);
        context.lineTo(x + labelTextOffset + labelTextWidth + labelTextPadding * 2, y - fontSize);
        context.lineTo(x + labelTextOffset + labelTextWidth + labelTextPadding * 2, y + fontSize);
        context.lineTo(x + labelTextOffset, y + fontSize);
        context.lineTo(x + labelTextOffset / 3, y);
        context.closePath();
        context.fillStyle = '#000';
        context.fill();

        // Draw label
        context.fillStyle = '#fff';
        context.textAlign = 'left';
        context.fillText(label.label, x + labelTextOffset + labelTextPadding, y + fontSize * 0.6);
      } else {
        // Draw tag background
        context.beginPath();
        context.moveTo(x - labelTextOffset, y - fontSize);
        context.lineTo(x - labelTextOffset - labelTextWidth - labelTextPadding * 2, y - fontSize);
        context.lineTo(x - labelTextOffset - labelTextWidth - labelTextPadding * 2, y + fontSize);
        context.lineTo(x - labelTextOffset, y + fontSize);
        context.lineTo(x - labelTextOffset / 3, y);
        context.closePath();
        context.fillStyle = '#000';
        context.fill();

        // Draw label
        context.fillStyle = '#fff';
        context.textAlign = 'right';
        context.fillText(label.label, x - labelTextOffset - labelTextPadding, y + fontSize * 0.6);
      }
    }
  };
  const labelLevel1 = (label: Mark, index: number) => {
    const fontSize = 15;

    // Set this before measuring
    context.font = `400 ${fontSize}px ABCSans`;

    const [x, y] = projection(label.center);

    context.textBaseline = 'middle';
    context.textAlign = 'center';
    context.fillStyle = '#000';
    context.strokeStyle = 'rgba(255,255,255,0.4)';
    context.lineWidth = 3;
    context.strokeText(label.label.toUpperCase(), x, y);
    context.fillText(label.label.toUpperCase(), x, y);
  };
  const labelLevel2 = (label: Mark) => {
    const fontSize = 13;

    // Set this before measuring
    context.font = `700 ${fontSize}px ABCSans`;
    const labelTextWidth = context.measureText(label.label).width;
    const [x, y] = projection(label.center);

    context.textBaseline = 'middle';
    context.textAlign = 'center';
    context.fillStyle = '#000';
    context.strokeStyle = 'rgba(255,255,255,0.4)';
    context.lineWidth = 3;
    context.strokeText(label.label, x + labelTextWidth / 2 + 15, y);
    context.fillText(label.label, x + labelTextWidth / 2 + 15, y);
  };
  const labelLevel3 = (label: Mark) => {
    const fontSize = 14;
    const labelTextOffset = 10;
    const labelTextPadding = 10;
    // Set this before measuring
    context.font = `700 ${fontSize}px ABCSans`;
    const labelTextWidth = context.measureText(label.label).width;
    const [x, y] = projection(label.center);

    context.beginPath();
    context.moveTo(x + labelTextOffset, y - fontSize);
    context.lineTo(x + labelTextOffset + labelTextWidth + labelTextPadding * 2, y - fontSize);
    context.lineTo(x + labelTextOffset + labelTextWidth + labelTextPadding * 2, y + fontSize);
    context.lineTo(x + labelTextOffset, y + fontSize);
    context.lineTo(x + labelTextOffset / 3, y);
    context.closePath();
    context.fillStyle = 'rgba(237, 240, 242, 0.80)';
    context.fill();

    // Draw label
    context.fillStyle = '#000';
    context.textAlign = 'left';
    context.fillText(label.label, x + labelTextOffset + labelTextPadding, y + fontSize * 0.6);
  };

  const inversePosition = (): [number, number] => {
    return [-projection.rotate()[0], -projection.rotate()[1]];
  };

  // Draw any labels
  labels.forEach((label: Mark, index: number) => {
    // Don't print labels on the other side of the world
    if (geoDistance(label.center, inversePosition()) > 1.5707963267949) return;

    switch (label.labelVariant) {
      case 'country':
        return labelLevel1(label, index);
      case 'city':
        return labelLevel2(label);
      case 'sea':
        return labelLevel3(label);
      default:
        labelDefault(label, index);
    }
  });
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
