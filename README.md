# Two code smells from my projects

Yifei Jason Yang · Individual submission · CMPM 121 S04 / S05  
**Smells:** Duplicated Code and Long Parameter List  
**Languages:** JavaScript and TypeScript

In Morningstar Port, picking up a health pack can show either a healing message or an “HP FULL” message. In my Sticker Sketchpad, moving the pointer adds points to a brush stroke. These features work, but the code behind them gives me two places to look more closely at the design.

I chose these examples because I can explain what the player or user sees, what the code does, and what a refactoring needs to preserve. The original examples below come from my actual project files. The proposed changes are study examples; they have not been applied to either application.

| Project | Language | Code smell | Refactoring |
| --- | --- | --- | --- |
| Morningstar Port | JavaScript | Duplicated Code | Extract Function / Extract Method |
| Sticker Sketchpad | TypeScript | Long Parameter List | Introduce Parameter Object |

[Health-pack example](#1-duplicated-code-in-morningstar-port) · [Pointer example](#2-long-parameter-list-in-sticker-sketchpad) · [Checks](#checking-the-changes) · [Sources](#sources)

## 1. Duplicated Code in Morningstar Port

### Two messages, almost the same animation

The example comes from `src/Systems/HealthPackManager.js` in my local Morningstar Port project. When the player collects a pack below maximum health, `collect` calls `flashHeal`. At full health, it calls `flashFull` and leaves the pack available.

These are the original two methods, wrapped in a small class so they can be run separately from the game:

```javascript
export default class HealthPackFeedback {
  constructor(scene) { this.scene = scene; }
  flashHeal(x, y, amount) {
    const scene = this.scene;
    const text = scene.add.text(x, y - 32, `+${amount} HP`, {
      fontFamily: "monospace",
      fontSize: "24px",
      color: "#b8ffd6",
      stroke: "#00190a",
      strokeThickness: 5
    }).setOrigin(0.5).setDepth(2000);

    scene.tweens.add({
      targets: text,
      y: y - 70,
      alpha: 0,
      duration: 720,
      ease: "Quad.easeOut",
      onComplete: () => text.destroy()
    });
  }

  flashFull(x, y) {
    const scene = this.scene;
    const text = scene.add.text(x, y - 32, "HP FULL", {
      fontFamily: "monospace",
      fontSize: "20px",
      color: "#e8fff1",
      stroke: "#00190a",
      strokeThickness: 4
    }).setOrigin(0.5).setDepth(2000);

    scene.tweens.add({
      targets: text,
      y: y - 58,
      alpha: 0,
      duration: 420,
      ease: "Quad.easeOut",
      onComplete: () => text.destroy()
    });
  }

}
```

The messages have different jobs. Healing shows `+1 HP` or `+2 HP`; full health shows `HP FULL`. Their sizes, colors, travel distances, and durations also differ.

What repeats is the animation setup: create text above the pack, center it, give it depth 2000, move it upward while fading it out, and destroy it when the tween finishes. That shared sequence is the **Duplicated Code** smell.

This kind of duplication can arise when a second feedback message starts as a copy of the first. The maintenance problem appears when the shared presentation changes. For example, changing the font or the cleanup behavior would require editing both methods. Updating just one could make the two messages inconsistent. I am identifying a maintenance risk here, not reporting an observed game bug.

### What I would extract

Fowler's **Extract Function**, also called Extract Method, gives the repeated sequence a name. I would keep `flashHeal` and `flashFull` as the entry points and move the common animation into `flashMessage`.

```javascript
export default class HealthPackFeedback {
  constructor(scene) { this.scene = scene; }

  flashHeal(x, y, amount) {
    this.flashMessage(x, y, `+${amount} HP`, {
      fontSize: "24px", color: "#b8ffd6", strokeThickness: 5,
      rise: 70, duration: 720
    });
  }

  flashFull(x, y) {
    this.flashMessage(x, y, "HP FULL", {
      fontSize: "20px", color: "#e8fff1", strokeThickness: 4,
      rise: 58, duration: 420
    });
  }

  flashMessage(x, y, message, style) {
    const scene = this.scene;
    const text = scene.add.text(x, y - 32, message, {
      fontFamily: "monospace",
      fontSize: style.fontSize,
      color: style.color,
      stroke: "#00190a",
      strokeThickness: style.strokeThickness
    }).setOrigin(0.5).setDepth(2000);

    scene.tweens.add({
      targets: text,
      y: y - style.rise,
      alpha: 0,
      duration: style.duration,
      ease: "Quad.easeOut",
      onComplete: () => text.destroy()
    });
  }
}
```

Now each entry point mainly says how its message differs. The helper owns the repeated creation, tween, and cleanup sequence. A shared font change has one place to go.

The numbers are deliberately unchanged. Healing still lasts 720 ms and ends at `y - 70`; the full-health message still lasts 420 ms and ends at `y - 58`. Making the messages look identical would change the presentation rather than just refactor its implementation.

To prevent this smell, I would compare related feedback methods when adding a new message and ask which parts need to change together. I would keep this helper local to health-pack feedback for now. Two similar effects do not justify a game-wide effects framework, especially if other messages need different lifetimes or cleanup rules.

## 2. Long Parameter List in Sticker Sketchpad

### Moving the pointer needs seven arguments

Sticker Sketchpad is my browser drawing project. It stores a stroke as points and redraws the canvas as the user drags. The source is [the original pointer module at the studied commit](https://github.com/yifeiyang19-code/CMPM_121_D2/blob/50bea4302ed042c327865fc2231411927543a6d9/src/pointer.ts).

This is its actual pointer-movement function:

```typescript
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
```

The [caller in `main.ts`](https://github.com/yifeiyang19-code/CMPM_121_D2/blob/50bea4302ed042c327865fc2231411927543a6d9/src/main.ts) supplies the canvas, three pieces of drawing state, and two callbacks:

```typescript
function handlePointerMove(event: PointerEvent) {
  updatePointerMove(
    event,
    canvas,
    activePointerId,
    currentPoint,
    activeStroke,
    (point) => {
      currentPoint = point;
    },
    renderDrawing,
  );
}
```

The function has seven parameters. More importantly, the caller has to assemble the same drawing context every time. `activePointerId`, `currentPoint`, and `activeStroke` describe the drawing gesture; the setter and renderer are operations the handler needs to update it.

That is why I see a **Long Parameter List** here. The problem is the amount of coordination at the call site. If the handler later needs another piece of gesture state, both its signature and every caller need another positional argument. TypeScript can catch many incompatible argument types, but it does not make this dependency list easy to scan.

### A smaller interface

I used **Introduce Parameter Object** in the study version. The event stays separate, and a `PointerMoveContext` names the state and callbacks needed for the move:

```typescript
export type PointerMoveContext = {
  canvas: HTMLCanvasElement;
  activePointerId: number | null;
  currentPoint: Point | null;
  activeStroke: StrokeData | null;
  setCurrentPoint: (point: Point) => void;
  renderDrawing: () => void;
};

export function handlePointerMove(
  event: PointerEvent,
  context: PointerMoveContext,
) {
  const {
    canvas, activePointerId, currentPoint, activeStroke,
    setCurrentPoint, renderDrawing,
  } = context;

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
```

The event wrapper now calls it like this:

```typescript
function handlePointerMove(event: PointerEvent) {
  updatePointerMove(event, {
    canvas,
    activePointerId,
    currentPoint,
    activeStroke,
    setCurrentPoint: (point) => {
      currentPoint = point;
    },
    renderDrawing,
  });
}
```

The interface goes from seven positional arguments to an event and one context. The call is still explicit about its dependencies, but each field has a name instead of a position to remember.

There is an important detail in this project: the context must use the **current** gesture state. Building it once at startup would capture the initial null values. The wrapper above builds it for each event and retains the existing setter callback. Assigning a new point only to a temporary context object would leave `main.ts` holding the old point.

The longer object literal is a tradeoff: this change names the dependencies rather than making them disappear. Putting unrelated arguments into an object only hides a long list. Here the fields belong together because they support one pointer-movement operation. To keep the interface from growing again, I would pass only the capabilities this handler needs rather than the entire application state.

The runnable study files are [sketchpad-before.ts](sketchpad-before.ts) and [sketchpad-after.ts](sketchpad-after.ts). They share the original coordinate-conversion helper. The original application remains unchanged.

## What changes across the two languages?

JavaScript makes the health-pack extraction straightforward: a method receives a style object and uses its fields. Missing or misspelled fields would still be runtime problems, so the small helper needs checks.

TypeScript gives the pointer context a declared type, including its nullable state and callback signatures. That helps check the refactoring, but it cannot ensure that the values are fresh or that a callback updates the right owner. Those are behavior questions in either language.

These are two real examples across two languages, rather than the same invented example translated twice. JavaScript and TypeScript are closely related; the comparison here concerns their use in these projects, not a claim that they represent very different programming paradigms.

## Checking the changes

The examples run independently of the full applications. From this repository folder, use Node.js 18+ for the Morningstar check and Deno 2 for the TypeScript checks:

```sh
node check-morningstar.mjs
deno task check
```

Expected output:

```text
PASS: 5 Morningstar before/after call traces match

# Deno prints each case, followed by:
ok | 8 passed | 0 failed
```

The check records the text creation, origin, depth, tween settings, and destruction callback in a small scene substitute. It compares both implementations for one-HP healing, two-HP healing, full health, and unusual coordinates. It also checks the original durations and final heights. This verifies those calls and cleanup wiring; it does not run Phaser's renderer or verify the animation on screen.

The eight TypeScript cases compare both implementations and check expected points and callback order. They cover:

| Action | Behavior to preserve |
| --- | --- |
| Move without an active pointer | No added point or redraw |
| Move a different pointer | No change to the active stroke |
| Move with missing point or stroke | Return without changing state |
| Send the same position again | Do not append a duplicate point |
| Move to a new position | Update the caller's point, append once, then redraw |
| Send a second event at the same position | Read the updated point and skip it |
| Use pointer ID zero | Treat zero as an active ID |
| Draw on a scaled canvas | Convert browser coordinates to canvas coordinates |

These checks cover the isolated behavior of the examples. An application integration would still need drawing and in-game visual checks. The change I would look for in both projects is easier maintenance with the same visible result. Neither example needs a new gameplay rule.

## Sources

- Martin Fowler, [Code Smell](https://martinfowler.com/bliki/CodeSmell.html). A smell is a clue to investigate; its presence alone does not establish a design failure.
- Martin Fowler, *Refactoring*, second edition, Chapter 3, "Bad Smells in Code," with Kent Beck. The [publisher's contents](https://www.informit.com/store/refactoring-improving-the-design-of-existing-code-9780134757711) list Duplicated Code and Long Parameter List.
- Martin Fowler, [Extract Function](https://refactoring.com/catalog/extractFunction.html) and [Introduce Parameter Object](https://refactoring.com/catalog/introduceParameterObject.html). Named refactorings used in this study.
- Morningstar Port, local `src/Systems/HealthPackManager.js`, inspected November 2, 2026. The two original feedback methods are included in [morningstar-before.mjs](morningstar-before.mjs); unrelated game code and assets are not included.
- Sticker Sketchpad, [`pointer.ts`](https://github.com/yifeiyang19-code/CMPM_121_D2/blob/50bea4302ed042c327865fc2231411927543a6d9/src/pointer.ts) and [`main.ts`](https://github.com/yifeiyang19-code/CMPM_121_D2/blob/50bea4302ed042c327865fc2231411927543a6d9/src/main.ts), commit `50bea4302ed042c327865fc2231411927543a6d9`.
- Course handout, *S04: Code Smells*, for the research and README presentation requirements. The linked Drive chapter was unavailable during preparation; the chapter listing was checked through the publisher.

Original application excerpts come from my projects. Generative AI assisted with the study refactorings, documentation, and regression checks.
