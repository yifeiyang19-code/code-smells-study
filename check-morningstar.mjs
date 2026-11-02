import assert from 'node:assert/strict';
import Before from './morningstar-before.mjs';
import After from './morningstar-after.mjs';

function record(Feedback, method, args) {
  const calls = [];
  const text = {
    setOrigin(value) { calls.push(['origin', value]); return this; },
    setDepth(value) { calls.push(['depth', value]); return this; },
    destroy() { calls.push(['destroy']); }
  };
  const scene = {
    add: { text(...values) { calls.push(['text', ...values]); return text; } },
    tweens: { add({targets, onComplete, ...settings}) {
      assert.equal(targets, text);
      calls.push(['tween', settings]);
      onComplete();
    } }
  };
  new Feedback(scene)[method](...args);
  return calls;
}
let checked = 0;
for (const [method, args] of [
  ['flashHeal', [100, 200, 1]], ['flashHeal', [100, 200, 2]],
  ['flashFull', [100, 200]], ['flashHeal', [-20, 0, 2]],
  ['flashFull', [0, -10]]
]) {
  const before = record(Before, method, args);
  const after = record(After, method, args);
  assert.deepEqual(after, before);
  assert.equal(after[0][2], args[1] - 32);
  assert.deepEqual(after.at(-1), ['destroy']);
  const tween = after.find(([type]) => type === 'tween')[1];
  assert.equal(tween.duration, method === 'flashHeal' ? 720 : 420);
  assert.equal(tween.y, args[1] - (method === 'flashHeal' ? 70 : 58));
  checked++;
}
console.log(`PASS: ${checked} Morningstar before/after call traces match`);
