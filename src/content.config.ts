import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const works = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/works' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      catalogNumber: z.string(), // HU-01
      matrixNumber: z.string(), // HUR-001-A
      category: z.enum([
        'LP',
        '12-inch',
        'Liner Notes',
        'Spec Sheet',
        'Cert EP',
        'Coming Soon',
      ]),
      year: z.number(),
      format: z.string(), // 物理フォーマットの一言（ジャケットの世界観）
      shortDescription: z.string(),
      jacket: image(),
      githubUrl: z.string().url().optional(),
      liveUrl: z.string().url().optional(),
      npmUrl: z.string().url().optional(),
      techStack: z.array(z.string()).default([]),
      order: z.number(), // 棚の並び順（左から右）
      href: z.string(), // クリック時の遷移先（/works/* や /about#section）
    }),
});

export const collections = { works };
