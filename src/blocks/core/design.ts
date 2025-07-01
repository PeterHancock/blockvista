import { createLinearCongruentialGenerator } from "./utils/linear-congruential-generator";
import type { Block, Point, Rect } from "./types";

const pick = (n: number, rand: () => number) => Math.floor(n * rand());

const rectOverlap = (rect1: Rect, rect2: Rect): boolean => {
  if (rect1.origin.x >= rect2.extent.x || rect2.origin.x >= rect1.extent.x) {
    return false;
  }
  if (rect1.origin.y >= rect2.extent.y || rect2.origin.y >= rect1.extent.y) {
    return false;
  }
  return true;
};

const rectContains = (rect1: Rect, rect2: Rect): boolean =>
  rect1.origin.x <= rect2.origin.x &&
  rect1.extent.x >= rect2.extent.x &&
  rect1.origin.y <= rect2.origin.y &&
  rect1.extent.y >= rect2.extent.y;

const rectContainsPoint = (rect: Rect, p: Point): boolean =>
  rect.origin.x <= p.x &&
  rect.extent.x >= p.x &&
  rect.origin.y <= p.y &&
  rect.extent.y >= p.y;

const split = (
  { origin, extent }: Rect,
  axis: "x" | "y",
  split: number,
): [back: Rect, front: Rect] => {
  const w = extent.x - origin.x;
  const h = extent.y - origin.y;
  const origins: [Point, Point] = [
    axis === "x"
      ? { x: origin.x + w * split, y: origin.y }
      : { x: origin.x, y: origin.y + h * split },
    origin,
  ];
  const extents: [Point, Point] = [
    extent,
    axis === "x"
      ? { x: origin.x + w * split, y: extent.y }
      : { x: extent.x, y: origin.y + h * split },
  ];
  return [
    { origin: origins[0], extent: extents[0] },
    { origin: origins[1], extent: extents[1] },
  ];
};

const repeat = (
  { origin, extent }: Rect,
  axis: "x" | "y",
  n: number,
): Rect[] => {
  const w = extent.x - origin.x;
  const h = extent.y - origin.y;

  const origins: Point[] = [...Array(n)].map<Point>((_, i) =>
    axis === "x"
      ? { x: origin.x + (w * (n - 1 - i)) / n, y: origin.y }
      : { x: origin.x, y: origin.y + (h * (n - 1 - i)) / n },
  );
  const extents: Point[] = [...Array(n)].map<Point>((_, i) =>
    axis === "x"
      ? { x: origin.x + (w * (n - i)) / n, y: extent.y }
      : { x: extent.x, y: origin.y + (h * (n - i)) / n },
  );

  return origins.map((origin, i) => ({ origin, extent: extents[i] }));
};

export type Region = {
  seed: bigint;
  bounds: Rect;
  parents: Map<bigint, Region>;
  children: Map<bigint, Region>;
};

export const findBlocks = (
  region: Region,
  viewport: Rect,
  handleBlock: (block: Block) => void,
) => {
  let r = region;
  let n = false;

  while (!rectContains(r.bounds, viewport)) {
    if (region.parents.has(r.seed)) {
      r = region.parents.get(r.seed)!;
    } else {
      n = true;
      const rn = createParent(r);
      r.parents.set(r.seed, rn);
      r = rn;
    }
  }
  if (n) console.log(r.seed, r.bounds, viewport, r.parents, r.children);
  visitBlocks(r, viewport, 0, handleBlock);
};

const calculateParentSeed = (seed: bigint) => {
  const parentSeed = seed - 1n;
  return parentSeed === 0n ? 1n << 64n : parentSeed;
};

const pickSplit = (rand: () => number) => (pick(10, rand) + 10) / 30;
const pickRepeat = (rand: () => number) => pick(5, rand) + 1;

const createParent = (region: Region) => {
  const findMiddle = (
    seed: bigint,
    bounds: Rect,
  ): { seed: bigint; bounds: Rect } => {
    if (
      bounds.extent.x - bounds.origin.x > 0.05 &&
      bounds.extent.y - bounds.origin.y > 0.05
    ) {
      const { rand, randBigint: randBigInt } =
        createLinearCongruentialGenerator(seed);
      if (rand() < 4 / 5) {
        //split
        const divideAxis: "x" | "y" = rand() < 1 / 2 ? "x" : "y";
        const childBounds = split(bounds, divideAxis, pickSplit(rand)).find(
          (splitRect) => rectContainsPoint(splitRect, { x: 0.5, y: 0.5 }),
        )!;
        return findMiddle(randBigInt(), childBounds);
      } else {
        //repeat
        const divideAxis: "x" | "y" = rand() < 1 / 2 ? "x" : "y";
        const childBounds = repeat(bounds, divideAxis, pickRepeat(rand)).find(
          (repeatRect) => rectContainsPoint(repeatRect, { x: 0.5, y: 0.5 }),
        )!;
        return findMiddle(randBigInt(), childBounds);
      }
    } else {
      return { seed, bounds };
    }
  };
  const parentSeed = calculateParentSeed(region.seed as bigint);
  const { seed: nextSeed, bounds: childBounds } = findMiddle(parentSeed, {
    origin: { x: 0, y: 0 },
    extent: { x: 1, y: 1 },
  });
  region.children.set(nextSeed, region);

  // map child to childBounds
  const ax =
    (region.bounds.extent.x - region.bounds.origin.x) /
    (childBounds.extent.x - childBounds.origin.x);
  const bx = region.bounds.origin.x - ax * childBounds.origin.x;
  const ay =
    (region.bounds.extent.y - region.bounds.origin.y) /
    (childBounds.extent.y - childBounds.origin.y);
  const by = region.bounds.origin.y - ay * childBounds.origin.y;
  const bo: Point = {
    x: bx,
    y: by,
  };
  const be: Point = {
    x: ax + bx,
    y: ay + by,
  };
  return {
    ...region,
    seed: parentSeed,
    bounds: {
      origin: bo,
      extent: be,
    },
  };
};

const visitBlocks = (
  region: Region,
  viewport: Rect,
  height = 0,
  handleBlock: (block: Block) => void,
): void => {
  const seed = region.children.get(region.seed)?.seed || region.seed;
  const bounds = region.children.get(region.seed)?.bounds || region.bounds;
  if (rectOverlap(bounds, viewport)) {
    const { rand, randBigint: randBigInt } =
      createLinearCongruentialGenerator(seed);
    if (
      (bounds.extent.x - bounds.origin.x) * 50 <
        viewport.extent.x - viewport.origin.x ||
      (bounds.extent.y - bounds.origin.y) * 50 <
        viewport.extent.y - viewport.origin.y
    ) {
      const color = pick(5, rand);
      handleBlock({ ...bounds, height, color });
    } else {
      const nextHeight = height
        ? height * (1 + pick(20, rand) / 200)
        : pick(30, rand) / 200;
      if (rand() < 4 / 5) {
        // split
        const divideAxis: "x" | "y" = rand() < 1 / 2 ? "x" : "y";
        split(bounds, divideAxis, pickSplit(rand)).forEach((splitRect) => {
          visitBlocks(
            { ...region, seed: randBigInt(), bounds: splitRect },
            viewport,
            nextHeight,
            handleBlock,
          );
        });
      } else {
        // repeat
        const divideAxis: "x" | "y" = rand() < 1 / 2 ? "x" : "y";
        const nextSeed = randBigInt();
        repeat(bounds, divideAxis, pickRepeat(rand)).forEach((repeatRect) => {
          visitBlocks(
            { ...region, seed: nextSeed, bounds: repeatRect },
            viewport,
            nextHeight,
            handleBlock,
          );
        });
      }
    }
  }
};
