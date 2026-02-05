// app/robots.ts
import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/api/'], // Keep your secrets safe
    },
    sitemap: 'https://www.smartnote.com.ng/sitemap.xml',
  }
}