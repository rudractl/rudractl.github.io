/**
 * Tiny analytics bridge. Sends custom events to whichever providers are
 * configured in content/profile.yaml (site.analytics). A no-op otherwise.
 */
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    clarity?: (...args: unknown[]) => void;
  }
}

export function track(event: string, params: Record<string, string | number> = {}) {
  window.gtag?.('event', event, params);
  window.clarity?.('event', event);
}

/** Any element with data-track="event_name" (and optional data-track-label) is tracked on click. */
export function initClickTracking() {
  document.addEventListener('click', (e) => {
    const el = (e.target as HTMLElement).closest<HTMLElement>('[data-track]');
    if (!el) return;
    track(el.dataset['track'] ?? 'click', {
      label: el.dataset['trackLabel'] ?? el.textContent?.trim().slice(0, 60) ?? '',
      page: location.pathname,
    });
  });
}
