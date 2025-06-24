export const rad2deg = (deg: number) => (deg * 180) / Math.PI;
export const applyOpacity = (hex: string, opacity: number) => {
  if (hex.length >= 8 || hex.length < 6) {
    throw new Error('Can only apply opacity to 6 character hex colour codes');
  }
  return `${hex}${Math.round(opacity * 255)
    .toString(16)
    .padStart(2, '0')}`;
};
