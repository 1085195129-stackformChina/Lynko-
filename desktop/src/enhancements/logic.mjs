export function createTransferQueue() {
  const q = { active: null, items: [] };
  q.enqueue = (id) => q.items.push(id);
  q.queuedIds = () => q.items.slice();
  q.start = () => {
    if (q.active !== null) return false;
    q.active = q.items.shift() ?? null;
    return q.active !== null;
  };
  q.cancel = (id) => {
    const i = q.items.indexOf(id);
    if (i < 0) return false;
    q.items.splice(i, 1);
    return true;
  };
  q.done = (id) => { if (q.active === id) q.active = null; };
  q.fail = (id, err) => {
    if (q.active !== id) return;
    q.active = null;
    if (err) { q.errors = q.errors || {}; q.errors[id] = err; }
  };
  return q;
}

export function filterNotification(note, prefs) {
  if (prefs.notifications === false || prefs.blockedApps?.includes(note.app)) return null;
  return prefs.hidePreview ? {...note, title:'', body:''} : note;
}

/** Per-app mute/snooze gate. `muted` is a hard block list; `snoozed` maps
 *  app → epoch-ms when the suppression lifts. Pure so it's unit-testable;
 *  callers read the same shapes from localStorage (lynko-muted-apps,
 *  lynko-snoozed-apps) at event time. */
export function isAppSuppressed(app, muted, snoozed, now = Date.now()) {
  if (Array.isArray(muted) && muted.includes(app)) return true;
  const until = snoozed?.[app];
  return typeof until === "number" && until > now;
}

export function mirrorHealth(link, lastFrame, now, capable) {
  if (!link.connected) return 'disconnected';
  // `capable === false` is a real "phone says no screen_capture". `undefined`
  // means the phone never reported caps — NOT a capability verdict. Treating
  // it as unavailable misdiagnosed a healthy link as "not supported".
  if (capable === false) return 'unavailable';
  if (link.locked) return 'locked';
  if (link.mirror === undefined) return 'unknown';
  if (!link.mirror) return 'idle';
  if (lastFrame === null) return 'waiting';
  return now - lastFrame > 5000 ? 'stalled' : 'live';
}
