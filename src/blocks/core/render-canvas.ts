import type { Block } from "./types";
import { isoProject } from "./utils/isometric-projection";

export type Target = {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
};

type IsoProjectedBlock = {
  top: [number, number][];
  right: [number, number][];
  left: [number, number][];
  color: number;
};

const projectBlock = (block: Block): IsoProjectedBlock => ({
  top: (
    [
      [block.origin.x, block.origin.y],
      [block.origin.x, block.extent.y],
      [block.extent.x, block.extent.y],
      [block.extent.x, block.origin.y],
    ] as const
  ).map((xy) => isoProject(...xy, block.height)),
  right: (
    [
      [block.origin.x, block.origin.y, 0],
      [block.origin.x, block.origin.y, block.height],
      [block.extent.x, block.origin.y, block.height],
      [block.extent.x, block.origin.y, 0],
    ] as [number, number, number][]
  ).map((xyz) => isoProject(...xyz)),
  left: (
    [
      [block.origin.x, block.origin.y, 0],
      [block.origin.x, block.origin.y, block.height],
      [block.origin.x, block.extent.y, block.height],
      [block.origin.x, block.extent.y, 0],
    ] as [number, number, number][]
  ).map((xyz) => isoProject(...xyz)),
  color: block.color,
});

type ShadingOptions = {
  colorScheme: string[];
  colorRight: boolean;
  colorLeft: boolean;
  lineWidth: number;
};

export const drawBackground = ({ ctx, width, height }: Target) => {
  ctx.strokeStyle = "black";
  ctx.fillRect(0, 0, width, height);
};

export const drawFrame = (
  { ctx }: Target,
  color: string,
  lineWidth: number,
) => {
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, 1);
  ctx.lineTo(1, 1);
  ctx.lineTo(1, 0);
  ctx.closePath();
  ctx.moveTo(0.05, 0.05);
  ctx.lineTo(0.95, 0.05);
  ctx.lineTo(0.95, 0.95);
  ctx.lineTo(0.05, 0.95);
  ctx.closePath();

  ctx.fillStyle = color;
  ctx.fill();

  ctx.lineJoin = "miter";
  ctx.lineWidth = lineWidth;
  ctx.strokeRect(0.05, 0.05, 0.9, 0.9);
};

const renderFace = (
  { ctx }: Target,
  face: [number, number][],
  color: string,
  lineWidth: number,
) => {
  ctx.fillStyle = color;
  const [p1, p2, p3, p4] = face.map(([x, y]) => [x, y] as [number, number]);
  ctx.beginPath();
  ctx.lineWidth = lineWidth;
  ctx.moveTo(...p1);
  ctx.lineTo(...p2);
  ctx.lineTo(...p3);
  ctx.lineTo(...p4);
  ctx.stroke();
  ctx.fill();
};

export const drawBlock = (
  block: Block,
  target: Target,
  { colorScheme, lineWidth, colorLeft, colorRight }: ShadingOptions,
  c?: string,
) => {
  const { top, left, right, color } = projectBlock(block);
  const col = c || colorScheme[color];
  renderFace(target, top, col, lineWidth);
  renderFace(target, left, colorLeft ? col : "black", lineWidth);
  renderFace(target, right, colorRight ? col : "black", lineWidth);
};
