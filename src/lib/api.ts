/** Helpers for the static JSON API under /api — consumed by the search palette and a future `rudractl` CLI. */
export const json = (data: unknown) =>
  new Response(JSON.stringify(data, null, 2), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });

export const absolute = (path: string, site: URL | undefined) => new URL(path, site).toString();
