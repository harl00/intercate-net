import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

// Serves the raw markdown of each post at /blog/<slug>.md.
// Doubles as: (1) the slop-meter snapshot source, and
// (2) a clean, token-efficient representation for LLM/agent readers.
export async function getStaticPaths() {
  const posts = await getCollection('blog', ({ data }) => !data.draft);
  return posts.map((post) => ({ params: { slug: post.id }, props: { post } }));
}

export const GET: APIRoute = ({ props }) => {
  const { post } = props as { post: { body: string } };
  return new Response(post.body, {
    headers: { 'content-type': 'text/markdown; charset=utf-8' },
  });
};
