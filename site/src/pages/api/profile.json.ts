import type { APIRoute } from 'astro';
import { json } from '@/lib/api.ts';
import {
  getCertifications,
  getEducation,
  getExperience,
  getProfile,
  getSkills,
  getUses,
} from '@/lib/data.ts';
import { getSocialLinks } from '@/lib/site.ts';
import { getAvatar } from '@/lib/github.ts';

export const GET: APIRoute = () => {
  const { site: _site, contact: _contact, ...profile } = getProfile();
  return json({
    ...profile,
    links: getSocialLinks({ rss: true }).map(({ id, href, display }) => ({ id, href, display })),
    experience: getExperience(),
    education: getEducation(),
    certifications: getCertifications(),
    skills: getSkills(),
    uses: getUses(),
    avatar: getAvatar(),
  });
};
