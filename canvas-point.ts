import type { Point } from "./sketchpad-types.ts";

export function getsCanvasPoint(
  canvas: HTMLCanvasElement,
  event: PointerEvent,
): Point {
  const rect = canvas.getBoundingClientRect();
  const x = (event.clientX - rect.left) * (canvas.width / rect.width);
  const y = (event.clientY - rect.top) * (canvas.height / rect.height);
  return { x, y };
}
