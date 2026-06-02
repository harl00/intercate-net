import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    tags: z.array(z.enum(['ai-government', 'university', 'tuvalu', 'technology', 'essay'])),
    draft: z.boolean().default(false),
    ogImage: z.string().optional(),
    linkedinSnippet: z.string().optional(),
    project: z.string().optional(),
  }),
});

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    status: z.enum(['active', 'paused', 'complete']),
    tags: z.array(z.string()).default([]),
    featured: z.boolean().default(false),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    draft: z.boolean().default(false),
    resources: z.array(z.object({
      label: z.string(),
      type: z.enum(['pdf', 'doc', 'dataset', 'colab', 'github', 'link']),
      url: z.string(),
    })).default([]),
  }),
});

export const collections = { blog, projects };
