// Local-only diagnostics for ?review. No requests or persistent storage.
const output = document.createElement('output');
output.id = 'review-metrics';
output.hidden = true;
document.body.append(output);
const controls = document.createElement('button');
controls.textContent = 'Review: simulate WebGL loss';
controls.style.cssText = 'position:fixed;bottom:8px;right:8px;z-index:100;padding:8px;font-size:12px';
controls.addEventListener('click', () => {
  document.querySelector('canvas')?.getContext('webgl2')?.getExtension('WEBGL_lose_context')?.loseContext();
});
document.body.append(controls);
const intervals = [];
const movingIntervals = [];
const longTasks = [];
let lastFrame = 0;
const mutations = new MutationObserver(records => {
  if (!records.some(record => record.attributeName === 'data-progress')) return;
  const now = performance.now();
  const interval = now - lastFrame;
  if (lastFrame && interval < 250 && !document.hidden) {
    intervals.push(interval);
    if (document.querySelector('.iceberg-journey')?.dataset.settled === 'false') movingIntervals.push(interval);
    if (intervals.length > 10000) intervals.shift();
    if (movingIntervals.length > 10000) movingIntervals.shift();
  }
  lastFrame = now;
});
mutations.observe(document.getElementById('root'), { subtree: true, attributes: true, attributeFilter: ['data-progress'] });
const tasks = new PerformanceObserver(list => longTasks.push(...list.getEntries().map(entry => ({ start: entry.startTime, duration: entry.duration }))));
tasks.observe({ type: 'longtask', buffered: true });
function publish() {
  const frames = intervals.slice().sort((a, b) => a - b);
  const moving = movingIntervals.slice().sort((a, b) => a - b);
  const resources = performance.getEntriesByType('resource').filter(entry => entry.name.startsWith(location.origin)).map(entry => ({ path: new URL(entry.name).pathname, transfer: entry.transferSize, encoded: entry.encodedBodySize, duration: Math.round(entry.duration), start: Math.round(entry.startTime) }));
  output.dataset.metrics = JSON.stringify({ browser: navigator.userAgent, logicalCores: navigator.hardwareConcurrency, memoryGiB: navigator.deviceMemory, dpr: devicePixelRatio, viewport: [innerWidth, innerHeight], resources, frames: { count: frames.length, medianMs: frames[Math.floor(frames.length * .5)] ?? null, p95Ms: frames[Math.floor(frames.length * .95)] ?? null }, movingFrames: { count: moving.length, medianMs: moving[Math.floor(moving.length * .5)] ?? null, p95Ms: moving[Math.floor(moving.length * .95)] ?? null }, longTasks });
}
const timer = setInterval(publish, 500);
publish();
import.meta.hot?.dispose(() => { clearInterval(timer); mutations.disconnect(); tasks.disconnect(); output.remove(); controls.remove(); });
