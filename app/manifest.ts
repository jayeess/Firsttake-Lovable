import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Nata Connect | నట కనెక్ట్',
    short_name: 'Nata Connect',
    description:
      'A professional talent discovery and casting network for artists and recruiters.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#07111f',
    theme_color: '#008ca6',
    categories: ['business', 'entertainment', 'productivity'],
    icons: [
      {
        src: '/icon.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/nata-connect-emblem.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  };
}
