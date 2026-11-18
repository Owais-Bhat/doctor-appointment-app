import { SITE, abs } from './site'

/**
 * Structured data for the homepage: who the business is (Organization), the
 * website, and the application patients use. Facts only: sameAs and the
 * contact point appear when the matching settings exist.
 */
export function homeJsonLd() {
  const org = {
    '@type': 'Organization',
    '@id': abs('/#organization'),
    name: SITE.name,
    url: abs('/'),
    logo: { '@type': 'ImageObject', url: abs('/favicon.ico') },
    description: SITE.description,
    ...(SITE.sameAs.length ? { sameAs: SITE.sameAs } : {}),
    ...(SITE.email || SITE.phone
      ? { contactPoint: { '@type': 'ContactPoint', contactType: 'customer support', ...(SITE.email ? { email: SITE.email } : {}), ...(SITE.phone ? { telephone: SITE.phone } : {}), areaServed: 'IN', availableLanguage: ['English', 'Hindi'] } }
      : {}),
  }
  return {
    '@context': 'https://schema.org',
    '@graph': [
      org,
      {
        '@type': 'WebSite',
        '@id': abs('/#website'),
        url: abs('/'),
        name: SITE.name,
        description: SITE.description,
        inLanguage: 'en',
        publisher: { '@id': abs('/#organization') },
      },
      {
        '@type': 'WebApplication',
        '@id': abs('/#app'),
        name: SITE.name,
        url: abs('/'),
        description: SITE.description,
        applicationCategory: 'HealthApplication',
        operatingSystem: 'Web, Android',
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR', description: 'Free for patients; you pay only the doctor’s consultation fee.' },
        provider: { '@id': abs('/#organization') },
      },
      {
        '@type': 'WebPage',
        '@id': abs('/#webpage'),
        url: abs('/'),
        name: `${SITE.name} · ${SITE.tagline}`,
        isPartOf: { '@id': abs('/#website') },
        about: { '@id': abs('/#organization') },
      },
    ],
  }
}

/** JSON for a <script type="application/ld+json"> tag; "<" is escaped so the data can never close the tag. */
export const jsonLdString = (data: unknown) => JSON.stringify(data).replace(/</g, '\\u003c')
