import { findBlocks } from "./design";
import { createLinearCongruentialGenerator } from "./utils/linear-congruential-generator";
import {
  drawBackground,
  drawBlock,
  drawFrame,
  type Target,
} from "./render-canvas";
import { colors } from "./color-schemes";
import { isoProject } from "./utils/isometric-projection";

/**
 * Runs the block rendering process on a canvas context.
 *
 * @param ctx - The canvas rendering context to draw on.
 * @param seed - The seed for random number generation.
 * @param width - The width of the canvas.
 * @param height - The height of the canvas.
 * @returns A function to stop the animation.
 */

export const run = (
  ctx: CanvasRenderingContext2D,
  seed: bigint,
  width: number,
  height: number,
) => {
  const parents = new Map();
  const children = new Map();

  const target: Target = {
    ctx,
    width: 1,
    height: 1,
  };

  const bounds = {
    origin: { x: 0, y: 0 },
    extent: { x: 1, y: 1 },
  };

  const render = (elapsedTimeMs: number) => {
    const { rand } = createLinearCongruentialGenerator(seed);

    const pick = (n: number) => Math.floor(n * rand());

    const pickColorScheme = () => colors[pick(colors.length)];

    const vp1 = elapsedTimeMs / 20000;
    const vp2 = 1 + elapsedTimeMs / 20000;

    const viewport = {
      origin: { x: vp1, y: vp1 },
      extent: { x: vp2, y: vp2 },
    };

    const o = isoProject(
      viewport.origin.x,
      (viewport.origin.y + viewport.extent.y) / 2,
      0,
    );
    const oe =
      Math.sqrt(
        (viewport.origin.x - viewport.extent.x) *
          (viewport.origin.x - viewport.extent.x) +
          (viewport.origin.y - viewport.extent.y) *
            (viewport.origin.y - viewport.extent.y),
      ) / 2;

    const w = width / oe;

    const shading = {
      colorScheme: pickColorScheme(),
      colorRight: rand() < 0.5,
      colorLeft: rand() < 0.5,
      lineWidth: 1 / w,
    };

    const zoomOut = () => {
      const z = 1;
      ctx.transform(z, 0, 0, z, (width * (1 - z)) / 2, (width * (1 - z)) / 2);
    };

    ctx.resetTransform();
    zoomOut();
    ctx.transform(width, 0, 0, height, 0, 0);

    drawBackground(target);

    ctx.resetTransform();
    zoomOut();
    ctx.transform(1, 0, 0, -1, 0, height);
    ctx.transform(w, 0, 0, w, -o[0] * w, -o[1] * w);

    ctx.lineJoin = "round";
    findBlocks(
      {
        seed,
        bounds,
        parents,
        children,
      },
      viewport,
      (block) => {
        drawBlock(block, target, shading);
      },
    );

    ctx.resetTransform();
    zoomOut();
    ctx.transform(width, 0, 0, height, 0, 0);

    drawFrame(target, shading.colorScheme[0], 2 / width);
  };

  const start = performance.now();

  let running = true;

  const stop = () => {
    running = false;
  };

  const animate = (now: number) => {
    render(now - start);
    if (running) {
      requestAnimationFrame(animate);
    }
  };
  requestAnimationFrame(animate);

  return stop;
};
