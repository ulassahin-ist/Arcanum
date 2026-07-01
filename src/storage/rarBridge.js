// Bridges plain JS modules (comicArchive.js) to the singleton
// <RarExtractorBridge> WebView mounted on-demand near the app root.
// Unlike EpubCoverExtractor (mounted per-book, one-shot), rar extraction
// can be requested from anywhere at any time, so this keeps a job queue,
// a ref to whichever WebView instance is currently mounted, and a
// mount-state pub/sub so the WebView only exists while work is pending.

let webviewRef = null;
const pending = new Map(); // jobId -> { resolve, reject, timer }
let nextJobId = 1;

// If the hidden WebView reloads or dies mid-extraction (plausible on a
// large CBR that OOMs it), it never posts back a result — without a
// timeout, the reader just spins on its loading indicator forever
// instead of surfacing an error the UI can show.
const JOB_TIMEOUT_MS = 45_000;

// How long to wait for the WebView to mount + finish loading the HTML
// before giving up on a job. Distinct from JOB_TIMEOUT_MS, which covers
// the extraction itself once the bridge is actually alive.
const MOUNT_TIMEOUT_MS = 10_000;
const MOUNT_POLL_MS = 50;

// Delay before tearing the WebView down after the last job finishes, so
// back-to-back extractRarArchive calls reuse one mount instead of
// thrashing mount/unmount for every file.
const UNMOUNT_GRACE_MS = 1_000;

let mountListeners = [];
let isMounted = false;
let unmountTimer = null;

export function subscribeToMountState(cb) {
  mountListeners.push(cb);
  return () => {
    mountListeners = mountListeners.filter(l => l !== cb);
  };
}

function setMounted(value) {
  if (isMounted === value) return;
  isMounted = value;
  mountListeners.forEach(cb => cb(value));
}

function requestMount() {
  if (unmountTimer) {
    clearTimeout(unmountTimer);
    unmountTimer = null;
  }
  if (!isMounted) {
    setMounted(true);
  }
}

function scheduleUnmountIfIdle() {
  if (pending.size > 0) return;
  if (unmountTimer) clearTimeout(unmountTimer);
  unmountTimer = setTimeout(() => {
    unmountTimer = null;
    if (pending.size === 0) {
      setMounted(false);
    }
  }, UNMOUNT_GRACE_MS);
}

export function registerRarWebView(ref) {
  webviewRef = ref;
}

export function unregisterRarWebView(ref) {
  if (webviewRef === ref) {
    webviewRef = null;
    // The WebView that owned these jobs is gone — nothing will ever
    // answer them. Fail fast instead of waiting out the timeout.
    rejectAllPending('Rar extractor WebView was unmounted.');
  }
}

// dataBase64: the .rar/.cbr file contents, base64-encoded.
// Resolves to an array of { name, base64 } page entries.
export function extractRarArchive(dataBase64) {
  requestMount();

  const jobId = nextJobId++;
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      pending.delete(jobId);
      reject(new Error('RAR extraction timed out. Please try again.'));
      scheduleUnmountIfIdle();
    }, JOB_TIMEOUT_MS);
    pending.set(jobId, { resolve, reject, timer });

    waitForWebView(
      webview => {
        webview.postMessage(
          JSON.stringify({ type: 'extract', jobId, dataBase64 }),
        );
      },
      err => {
        const job = pending.get(jobId);
        if (job) {
          pending.delete(jobId);
          clearTimeout(job.timer);
          job.reject(err);
          scheduleUnmountIfIdle();
        }
      },
    );
  });
}

function waitForWebView(onReady, onTimeout) {
  const start = Date.now();
  const poll = () => {
    if (webviewRef) {
      onReady(webviewRef);
      return;
    }
    if (Date.now() - start >= MOUNT_TIMEOUT_MS) {
      onTimeout(new Error('Rar extractor WebView failed to start.'));
      return;
    }
    setTimeout(poll, MOUNT_POLL_MS);
  };
  poll();
}

export function handleRarBridgeMessage(raw) {
  let msg;
  try {
    msg = JSON.parse(raw);
  } catch {
    return;
  }
  const job = pending.get(msg.jobId);
  if (!job) return;
  pending.delete(msg.jobId);
  clearTimeout(job.timer);
  if (msg.type === 'extract-result') {
    job.resolve(msg.entries);
  } else if (msg.type === 'extract-error') {
    job.reject(new Error(msg.error || 'RAR extraction failed'));
  }
  scheduleUnmountIfIdle();
}

function rejectAllPending(message) {
  for (const [jobId, job] of pending) {
    clearTimeout(job.timer);
    job.reject(new Error(message));
  }
  pending.clear();
  scheduleUnmountIfIdle();
}
