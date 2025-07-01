export const toBigintSafe = (n: bigint | boolean | number | string) => {
  try {
    return BigInt(n);
  } catch {
    // Ignore error and try next parse strategy
  }
  try {
    return BigInt(`0x${n}`);
  } catch {
    // Ignore error and try next parse strategy
  }
  return null;
};
