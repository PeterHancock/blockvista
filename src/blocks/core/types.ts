export type Point = {
  x: number;
  y: number;
};

export type Rect = {
  origin: Point;
  extent: Point;
};

export type Block = Rect & {
  height: number;
  color: number;
};
