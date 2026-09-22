import assert from 'node:assert/strict';
import { navigateFromTelevision } from '../i  a m/fullscreen-navigation.js';
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

function fixture(kind) {
  const document = new EventTarget();
  const events = [];
  document.fullscreenElement = kind === 'standard' ? {} : null;
  document.webkitFullscreenElement = kind === 'webkit' ? {} : null;
  let finish;
  if (kind === 'standard') document.exitFullscreen = () => {
    events.push('exit');
    return new Promise(resolve => { finish = () => {
      document.fullscreenElement = null;
      document.dispatchEvent(new Event('fullscreenchange'));
      resolve();
    }; });
  };
  if (kind === 'webkit') document.webkitExitFullscreen = () => {
    events.push('exit');
    finish = () => {
      document.webkitFullscreenElement = null;
      document.dispatchEvent(new Event('webkitfullscreenchange'));
    };
  };
  const run = () => navigateFromTelevision({ document,
    pause: () => events.push('pause'),
    teardown: () => events.push('teardown'),
    navigate: () => events.push('navigate'),
  });
  return { document, events, run, finish: () => finish() };
}

for (const kind of ['standard', 'webkit']) {
  const f = fixture(kind);
  const pending = f.run();
  await delay(20);
  assert.deepEqual(f.events, ['pause', 'exit'], `${kind} must hold the page and media elements throughout exit`);
  f.finish();
  await pending;
  assert.deepEqual(f.events, ['pause', 'exit', 'teardown', 'navigate']);
}
const promiseFirst = fixture('standard');
promiseFirst.document.exitFullscreen = () => Promise.resolve();
const lateState = promiseFirst.run();
await delay(20);
assert.deepEqual(promiseFirst.events, ['pause'], 'An exit Promise alone cannot unload a still-fullscreen page');
promiseFirst.document.fullscreenElement = null;
promiseFirst.document.dispatchEvent(new Event('fullscreenchange'));
await lateState;
assert.deepEqual(promiseFirst.events, ['pause', 'teardown', 'navigate']);

const eventFirst = fixture('standard');
let resolveExit;
eventFirst.document.exitFullscreen = () => {
  eventFirst.document.fullscreenElement = null;
  eventFirst.document.dispatchEvent(new Event('fullscreenchange'));
  return new Promise(resolve => { resolveExit = resolve; });
};
const slowExit = eventFirst.run();
await delay(20);
assert.deepEqual(eventFirst.events, ['pause'], 'An early event cannot unload while the exit Promise is pending');
resolveExit();
await slowExit;
assert.deepEqual(eventFirst.events, ['pause', 'teardown', 'navigate']);

const rejected = fixture('standard');
rejected.document.exitFullscreen = () => Promise.reject(new Error('denied'));
await assert.rejects(rejected.run(), /denied/);
assert.deepEqual(rejected.events, ['pause']);
const unsupported = fixture('webkit');
delete unsupported.document.webkitExitFullscreen;
await assert.rejects(unsupported.run(), /unavailable/);
assert.deepEqual(unsupported.events, ['pause']);
const ordinary = fixture('none');
await ordinary.run();
assert.deepEqual(ordinary.events, ['pause', 'teardown', 'navigate']);
console.log('PASS: standard, WebKit, delayed Promise/event, rejected/unsupported exit, ordinary navigation');
