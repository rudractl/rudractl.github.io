/**
 * Build-time social preview cards (1200×630 PNG) — satori renders the layout,
 * resvg rasterises it. No external service, no runtime cost.
 */
import fs from 'node:fs';
import path from 'node:path';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';

const font = (pkg: string, file: string) =>
  fs.readFileSync(path.resolve(process.cwd(), 'node_modules', pkg, 'files', file));

let fonts: Parameters<typeof satori>[1]['fonts'] | undefined;
const loadFonts = () =>
  (fonts ??= [
    {
      name: 'Inter',
      data: font('@fontsource/inter', 'inter-latin-400-normal.woff'),
      weight: 400,
      style: 'normal',
    },
    {
      name: 'Inter',
      data: font('@fontsource/inter', 'inter-latin-700-normal.woff'),
      weight: 700,
      style: 'normal',
    },
    {
      name: 'JetBrains Mono',
      data: font('@fontsource/jetbrains-mono', 'jetbrains-mono-latin-400-normal.woff'),
      weight: 400,
      style: 'normal',
    },
    {
      name: 'JetBrains Mono',
      data: font('@fontsource/jetbrains-mono', 'jetbrains-mono-latin-700-normal.woff'),
      weight: 700,
      style: 'normal',
    },
  ]);

type Node = { type: string; props: Record<string, unknown> & { children?: unknown } };
const h = (type: string, style: Record<string, unknown>, children?: unknown): Node => ({
  type,
  props: { style: { display: 'flex', ...style }, children },
});

export interface OgCard {
  section: string;
  command: string;
  title: string;
  subtitle?: string | undefined;
  tags?: string[] | undefined;
  author: string;
  role: string;
  site: string;
}

const C = {
  bg: '#090b0f',
  surface: '#11151c',
  bar: '#0d1016',
  border: '#232b37',
  text: '#e6edf3',
  muted: '#7d8898',
  accent: '#4ade80',
  blue: '#6ea8fe',
};

const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, s.lastIndexOf(' ', n))}…` : s);

export async function renderOgImage(card: OgCard): Promise<Buffer> {
  const titleSize = card.title.length > 70 ? 40 : card.title.length > 40 ? 48 : 60;

  const tree = h(
    'div',
    {
      width: 1200,
      height: 630,
      padding: 48,
      backgroundColor: C.bg,
      backgroundImage: `radial-gradient(circle at 85% -10%, rgba(74,222,128,0.18), transparent 55%), radial-gradient(circle at 0% 110%, rgba(110,168,254,0.12), transparent 50%)`,
      fontFamily: 'Inter',
    },
    h(
      'div',
      {
        flexDirection: 'column',
        width: 1104,
        height: 534,
        borderRadius: 24,
        border: `1px solid ${C.border}`,
        backgroundColor: C.surface,
        overflow: 'hidden',
      },
      [
        // Terminal title bar
        h(
          'div',
          {
            alignItems: 'center',
            gap: 12,
            padding: '18px 28px',
            backgroundColor: C.bar,
            borderBottom: `1px solid ${C.border}`,
          },
          [
            h('div', { width: 14, height: 14, borderRadius: 99, backgroundColor: '#ff5f57' }),
            h('div', { width: 14, height: 14, borderRadius: 99, backgroundColor: '#febc2e' }),
            h('div', { width: 14, height: 14, borderRadius: 99, backgroundColor: '#28c840' }),
            h(
              'div',
              { marginLeft: 16, fontFamily: 'JetBrains Mono', fontSize: 20, color: C.muted },
              `rudractl — ${card.section}`,
            ),
          ],
        ),
        // Body
        h(
          'div',
          {
            flexDirection: 'column',
            flexGrow: 1,
            padding: '40px 56px 44px',
            justifyContent: 'space-between',
          },
          [
            h('div', { flexDirection: 'column', gap: 22 }, [
              h('div', { fontFamily: 'JetBrains Mono', fontSize: 24, color: C.muted }, [
                h('span', { color: C.accent, marginRight: 14 }, '$'),
                h('span', { color: C.text }, card.command),
              ]),
              h(
                'div',
                {
                  fontFamily: 'JetBrains Mono',
                  fontSize: titleSize,
                  fontWeight: 700,
                  color: C.text,
                  lineHeight: 1.12,
                  letterSpacing: '-0.03em',
                  maxWidth: 960,
                },
                card.title,
              ),
              card.subtitle
                ? h(
                    'div',
                    { fontSize: 26, color: C.muted, lineHeight: 1.4, maxWidth: 940 },
                    clip(card.subtitle, 130),
                  )
                : h('div', {}),
            ]),
            h('div', { width: '100%', alignItems: 'flex-end', justifyContent: 'space-between' }, [
              h(
                'div',
                { fontFamily: 'JetBrains Mono', fontSize: 22, color: C.blue, gap: 16 },
                (card.tags ?? []).slice(0, 4).join('  •  '),
              ),
              h('div', { flexDirection: 'column', alignItems: 'flex-end', gap: 4 }, [
                h(
                  'div',
                  { fontFamily: 'JetBrains Mono', fontSize: 26, fontWeight: 700, color: C.text },
                  card.author,
                ),
                h(
                  'div',
                  { fontFamily: 'JetBrains Mono', fontSize: 18, color: C.accent },
                  card.site,
                ),
              ]),
            ]),
          ],
        ),
      ],
    ),
  );

  const svg = await satori(tree as Parameters<typeof satori>[0], {
    width: 1200,
    height: 630,
    fonts: loadFonts(),
  });
  return new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } }).render().asPng();
}
