import { getProfile } from './data.ts';

export const NAV = [
  { href: '/', label: 'home' },
  { href: '/opensource/', label: 'opensource' },
  { href: '/blog/', label: 'blog' },
  { href: '/lab/', label: 'lab' },
  { href: '/uses/', label: 'uses' },
  { href: '/about/', label: 'about' },
] as const;

export interface SocialLink {
  id: 'github' | 'linkedin' | 'medium' | 'email' | 'x' | 'mastodon' | 'rss';
  label: string;
  href: string;
  display: string;
}

export function getSocialLinks({ rss = false } = {}): SocialLink[] {
  const { contact } = getProfile();
  const links: SocialLink[] = [];
  if (contact.github)
    links.push({
      id: 'github',
      label: 'GitHub',
      href: `https://github.com/${contact.github}`,
      display: `github.com/${contact.github}`,
    });
  if (contact.linkedin)
    links.push({
      id: 'linkedin',
      label: 'LinkedIn',
      href: `https://www.linkedin.com/in/${contact.linkedin}`,
      display: `linkedin.com/in/${contact.linkedin}`,
    });
  if (contact.medium) {
    const user = contact.medium.replace(/^@/, '');
    links.push({
      id: 'medium',
      label: 'Medium',
      href: `https://medium.com/@${user}`,
      display: `medium.com/@${user}`,
    });
  }
  if (contact.x)
    links.push({
      id: 'x',
      label: 'X',
      href: `https://x.com/${contact.x}`,
      display: `x.com/${contact.x}`,
    });
  if (contact.mastodon)
    links.push({
      id: 'mastodon',
      label: 'Mastodon',
      href: contact.mastodon,
      display: contact.mastodon.replace(/^https?:\/\//, ''),
    });
  if (contact.email)
    links.push({
      id: 'email',
      label: 'Email',
      href: `mailto:${contact.email}`,
      display: contact.email,
    });
  if (rss) links.push({ id: 'rss', label: 'RSS', href: '/rss.xml', display: '/rss.xml' });
  return links;
}

/** The GitHub repository this site is built from (set automatically in Actions). */
export const sourceRepo = () =>
  process.env['GITHUB_REPOSITORY'] ?? `${getProfile().handle}/${getProfile().handle}.github.io`;

/** "Edit this page on GitHub" — Git is the CMS. */
export const editUrl = (filePath: string | undefined) =>
  filePath
    ? `https://github.com/${sourceRepo()}/edit/main/${filePath.replace(/\\/g, '/').replace(/^\.\//, '')}`
    : undefined;
