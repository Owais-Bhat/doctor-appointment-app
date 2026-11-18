import type { MetadataRoute } from 'next'
import { PUBLIC_PAGES, abs } from '@/lib/site'

/** /sitemap.xml: every page that is meant to be read without signing in. */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date('2026-10-25') // when the policies last changed (lib/legal.ts)
  return PUBLIC_PAGES.map((p) => ({ url: abs(p.path), lastModified, changeFrequency: p.path === '/' ? 'weekly' : 'monthly', priority: p.priority }))
}
