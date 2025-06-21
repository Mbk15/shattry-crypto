import { DATA } from "@/data/resume";
import { formatDate } from "@/lib/utils";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import he from "he";

interface WordPressPost {
  id: number;
  slug: string;
  title: {
    rendered: string;
  };
  content: {
    rendered: string;
  };
  date: string;
  excerpt: {
    rendered: string;
  };
  yoast_head_json?: {
    og_image?: Array<{
      url: string;
    }>;
  };
}

interface BlogPost {
  slug: string;
  metadata: {
    title: string;
    publishedAt: string;
    summary: string;
    image?: string;
  };
  content: string;
}

async function getPost(slug: string): Promise<BlogPost | null> {
  try {
    const res = await fetch(
      `https://cryptonews.com/wp-json/wp/v2/posts?slug=${slug}&_embed`
    );

    if (!res.ok) throw new Error(`Failed to fetch post: ${res.statusText}`);

    const posts: WordPressPost[] = await res.json();
    if (!posts.length) return null;

    const post = posts[0];

    return {
      slug: post.slug,
      content: he.decode(post.content.rendered), // Decode content HTML
      metadata: {
        title: he.decode(post.title.rendered), // Decode title HTML entities
        publishedAt: post.date,
        summary: he.decode(
          post.excerpt.rendered.replace(/<[^>]*>/g, "").trim()
        ),
        image: post.yoast_head_json?.og_image?.[0]?.url,
      },
    };
  } catch (error) {
    console.error(`Error fetching post ${slug}:`, error);
    return null;
  }
}

export async function generateStaticParams() {
  const res = await fetch(
    "https://cryptonews.com/wp-json/wp/v2/posts?author=316&per_page=100"
  );
  const posts: WordPressPost[] = await res.json();

  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata | undefined> {
  const post = await getPost(params.slug);
  if (!post) return;

  const ogImage =
    post.metadata.image || `${DATA.url}/og?title=${post.metadata.title}`;

  return {
    title: post.metadata.title,
    description: post.metadata.summary,
    openGraph: {
      title: post.metadata.title,
      description: post.metadata.summary,
      type: "article",
      publishedTime: post.metadata.publishedAt,
      url: `${DATA.url}/blog/${post.slug}`,
      images: [{ url: ogImage }],
    },
    twitter: {
      card: "summary_large_image",
      title: post.metadata.title,
      description: post.metadata.summary,
      images: [ogImage],
    },
  };
}

export default async function Blog({ params }: { params: { slug: string } }) {
  const post = await getPost(params.slug);
  if (!post) notFound();

  return (
    <section id="blog">
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            headline: post.metadata.title,
            datePublished: post.metadata.publishedAt,
            dateModified: post.metadata.publishedAt,
            description: post.metadata.summary,
            image:
              post.metadata.image ||
              `${DATA.url}/og?title=${post.metadata.title}`,
            url: `${DATA.url}/blog/${post.slug}`,
            author: {
              "@type": "Person",
              name: DATA.name,
            },
          }),
        }}
      />
      <h1 className="title font-bold text-3xl tracking-tighter max-w-[650px]">
        {post.metadata.title}
      </h1>
      <div className="flex justify-between items-center mt-2 mb-8 text-sm max-w-[650px]">
        <Suspense fallback={<p className="h-5" />}>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            {formatDate(post.metadata.publishedAt)}
          </p>
        </Suspense>
      </div>
      <article
        className="prose dark:prose-invert"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />
    </section>
  );
}
