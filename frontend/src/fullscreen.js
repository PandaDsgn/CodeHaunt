// Browsers only grant fullscreen in direct response to a user gesture and
// always allow Escape to exit it — there's no way to truly force or lock
// this from script. Best effort: request it right after login, offer a
// manual toggle, and nudge the user back in if they drop out of it.

export function isFullscreen() {
  return Boolean(document.fullscreenElement);
}

export function enterFullscreen() {
  if (document.documentElement.requestFullscreen) {
    return document.documentElement.requestFullscreen().catch(() => {});
  }
  return Promise.resolve();
}

export function exitFullscreen() {
  if (isFullscreen() && document.exitFullscreen) {
    return document.exitFullscreen().catch(() => {});
  }
  return Promise.resolve();
}

export function toggleFullscreen() {
  return isFullscreen() ? exitFullscreen() : enterFullscreen();
}
