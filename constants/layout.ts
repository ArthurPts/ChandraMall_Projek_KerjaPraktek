export function getProductColumns(width: number) {
  if (width >= 1440) return 6;
  if (width >= 1180) return 5;
  if (width >= 900) return 4;
  if (width >= 620) return 3;
  return 2;
}
