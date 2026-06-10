import { Metadata } from 'next';

export const blogMetadata: Metadata = {
  title: 'Blog - Developer Guides & Tutorials | ToolsLab',
  description:
    'Expert guides, tutorials, and best practices for developers. Learn about JSON, encoding, APIs, and more.',
  openGraph: {
    title: 'ToolsLab Blog - Developer Guides & Tutorials',
    description:
      'Expert guides, tutorials, and best practices for developers. Learn about JSON, encoding, APIs, and more.',
    type: 'website',
    url: 'https://toolslab.dev/blog',
    images: [
      {
        url: '/og-blog.png',
        width: 1200,
        height: 630,
        alt: 'ToolsLab Blog',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ToolsLab Blog - Developer Guides & Tutorials',
    description: 'Expert guides, tutorials, and best practices for developers.',
    images: ['/og-blog.png'],
  },
};
