const root6Recip = 1 / Math.sqrt(6);
const root2Recip = 1 / Math.sqrt(2);

export const isoProject = (
  x: number,
  y: number,
  z: number,
): [number, number] => [root2Recip * (x - y), root6Recip * (x + y + 2 * z)];
