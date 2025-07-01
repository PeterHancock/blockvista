const a = 6364136223846793005n;
const c = 1442695040888963407n;
const m = 1n << 64n;

export function createLinearCongruentialGenerator(seed: bigint) {
  if (seed < 0n) {
    throw Error("`seed` must be positive");
  }
  if (seed >= m) {
    throw Error("`seed` must be smaller than `modulus`");
  }
  let state: bigint = seed;

  const randBigint = () => {
    const stateNext = (state as bigint) * a + c;
    state = stateNext - ((stateNext >> 64n) << 64n);
    return state;
  };

  const rand = () => Number((randBigint() * (1n << 24n)) / m) / (1 << 24);

  return {
    rand,
    randBigint,
  };
}
