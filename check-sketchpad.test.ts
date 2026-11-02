import { handlePointerMove as before } from "./sketchpad-before.ts";
import { handlePointerMove as after } from "./sketchpad-after.ts";
import type { Point, StrokeData } from "./sketchpad-types.ts";

function equal(actual: unknown, expected: unknown) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

type Scenario = {
  name: string;
  pointerId: number | null;
  currentPoint: Point | null;
  hasStroke: boolean;
  eventIds: number[];
  expected: Point[];
};
const scenarios: Scenario[] = [
  { name: "no active pointer", pointerId: null, currentPoint: { x: 0, y: 0 }, hasStroke: true, eventIds: [7], expected: [] },
  { name: "different pointer", pointerId: 7, currentPoint: { x: 0, y: 0 }, hasStroke: true, eventIds: [8], expected: [] },
  { name: "missing current point", pointerId: 7, currentPoint: null, hasStroke: true, eventIds: [7], expected: [] },
  { name: "missing stroke", pointerId: 7, currentPoint: { x: 0, y: 0 }, hasStroke: false, eventIds: [7], expected: [] },
  { name: "duplicate position", pointerId: 7, currentPoint: { x: 100, y: 50 }, hasStroke: true, eventIds: [7], expected: [] },
  { name: "scaled canvas coordinates", pointerId: 7, currentPoint: { x: 0, y: 0 }, hasStroke: true, eventIds: [7], expected: [{ x: 100, y: 50 }] },
  { name: "zero is a valid pointer ID", pointerId: 0, currentPoint: { x: 0, y: 0 }, hasStroke: true, eventIds: [0], expected: [{ x: 100, y: 50 }] },
  { name: "second event reads updated point", pointerId: 7, currentPoint: { x: 0, y: 0 }, hasStroke: true, eventIds: [7, 7], expected: [{ x: 100, y: 50 }] },
];

function run(version: "before" | "after", scenario: Scenario) {
  const canvas = {
    width: 800, height: 600,
    getBoundingClientRect: () => ({ left: 10, top: 20, width: 400, height: 300 }),
  } as unknown as HTMLCanvasElement;
  let currentPoint = structuredClone(scenario.currentPoint);
  const stroke: StrokeData | null = scenario.hasStroke
    ? { kind: "stroke", points: [], color: "Black", width: 3 }
    : null;
  const calls: unknown[] = [];
  const setCurrentPoint = (point: Point) => {
    calls.push(["set", point, stroke?.points.length]);
    currentPoint = point;
  };
  const renderDrawing = () => {
    calls.push(["render", currentPoint, stroke?.points.length]);
  };
  for (const pointerId of scenario.eventIds) {
    const event = { pointerId, clientX: 60, clientY: 45 } as PointerEvent;
    if (version === "before") {
      before(event, canvas, scenario.pointerId, currentPoint, stroke, setCurrentPoint, renderDrawing);
    } else {
      // Build the context for this event, so currentPoint is not a startup snapshot.
      after(event, {
        canvas, activePointerId: scenario.pointerId,
        currentPoint, activeStroke: stroke, setCurrentPoint, renderDrawing,
      });
    }
  }
  return { points: stroke?.points ?? [], currentPoint, calls };
}

for (const scenario of scenarios) {
  Deno.test(scenario.name, () => {
    const original = run("before", scenario);
    const refactored = run("after", scenario);
    equal(refactored, original);
    equal(refactored.points, scenario.expected);
    equal(refactored.currentPoint, scenario.expected.at(-1) ?? scenario.currentPoint);
    equal(refactored.calls, scenario.expected.length
      ? [["set", { x: 100, y: 50 }, 0], ["render", { x: 100, y: 50 }, 1]]
      : []);
  });
}
