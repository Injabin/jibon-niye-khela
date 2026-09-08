import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Jibon Niye Khela — A Life Simulation',
    short_name: 'Jibon Niye Khela',
    description:
      'A free, browser-based life simulation. Live a whole life one year at a time, chase careers and relationships, and see how the story ends.',
    lang: 'en',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#f6f7fb',
    theme_color: '#0ea5e9',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      {
        src: '/icons/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}