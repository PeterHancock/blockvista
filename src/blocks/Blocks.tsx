import React, { use, useLayoutEffect, useRef } from "react";
import { run } from "./core/run";
import type { Seed } from "./seed-hook";

type Props = {
  seed: Promise<Seed>;
  width: number;
  height: number;
};

const Blocks: React.FC<Props> = ({ seed: seedPromise, width, height }) => {
  const canvas = useRef<HTMLCanvasElement | null>(null);

  const { seed, name } = use(seedPromise);

  useLayoutEffect(() => {
    const ctx = canvas.current?.getContext("2d");
    if (ctx) {
      return run(ctx, seed, width, height);
    }
  }, [seed, name, width, height]);

  return (
    <>
      <div>
        {seed.toString(16)}
        {`${(name && ` (${name})`) || ""}`}
      </div>
      <canvas id="canvas" ref={canvas} width={width} height={height}></canvas>
    </>
  );
};

export default Blocks;
