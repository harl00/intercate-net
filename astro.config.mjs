import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://intercate.net',
  integrations: [sitemap()],

  // When a page's URL changes (a rename, or moving it under a new path), keep the
  // old address working by adding it here: 'old-path': '/new-path'. Astro builds a
  // static redirect page for each entry, which GitHub Pages serves correctly.
  // Unknown URLs with no redirect fall through to the custom 404 page.
  redirects: {
    // 'blog/old-slug': '/blog/new-slug',
  },
});
