// Relevant drawing types from the original Sticker Sketchpad project.
export type Point = { x: number; y: number };
export type StrokeData = {
  kind: "stroke";
  points: Point[];
  color: string;
  width: number;
};
