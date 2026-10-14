/** kebab-case ids: "Hello World!" → "hello-world", "PiTunnel" → "pitunnel". Pure — used by the site and scripts. */
export const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);

/** Project id: explicit `slug`, else the repository name. */
export const projectId = (p: { slug?: string | undefined; repository: string }) =>
  p.slug ?? slugify(p.repository.split('/')[1] ?? p.repository);

/** Lab id: explicit `slug`, else the experiment name. */
export const labId = (l: { slug?: string | undefined; name: string }) => l.slug ?? slugify(l.name);
