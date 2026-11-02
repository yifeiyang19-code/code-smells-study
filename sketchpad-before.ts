import type { Point, StrokeData } from "./sketchpad-types.ts";
import { getsCanvasPoint } from "./canvas-point.ts";

export function handlePointerMove(
  event: PointerEvent,
  canvas: HTMLCanvasElement,
  activePointerId: number | null,
  currentPoint: Point | null,
  activeStroke: StrokeData | null,
  setCurrentPoint: (point: Point) => void,
  renderDrawing: () => void,
) {
  if (activePointerId === null || event.pointerId !== activePointerId) {
    return;
  }

  if (currentPoint === null || activeStroke === null) {
    return;
  }

  const { x, y } = getsCanvasPoint(canvas, event);

  // Skip duplicate points
  if (x === currentPoint.x && y === currentPoint.y) {
    return;
  }

  // Update the current stroke data
  const nextPoint = { x, y };
  setCurrentPoint(nextPoint);
  activeStroke.points.push(nextPoint);

  // Redraw the canvas using the updated data
  renderDrawing();
}
