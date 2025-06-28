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

async function fetchWithRetry(url: string, retries = 3): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, {
        headers: {
          Accept: "application/json",
          "User-Agent": "Mozilla/5.0 (compatible; Blog-Fetcher/1.0)",
        },
        // Add timeout to prevent hanging requests
        signal: AbortSignal.timeout(30000), // 30 second timeout
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      return res;
    } catch (error) {
      console.warn(`Fetch attempt ${i + 1} failed:`, error);
      if (i === retries - 1) throw error;

      // Wait before retrying (exponential backoff)
      await new Promise((resolve) =>
        setTimeout(resolve, Math.pow(2, i) * 1000)
      );
    }
  }
  throw new Error("All retry attempts failed");
}

async function safeJsonParse(response: Response): Promise<any> {
  const text = await response.text();

  try {
    return JSON.parse(text);
  } catch (error) {
    console.error("JSON Parse Error:", error);
    console.error("Response text preview:", text.substring(0, 500) + "...");

    // Try to find and fix common JSON issues
    let fixedText = text;

    // Remove potential BOM or invisible characters at the start
    fixedText = fixedText.replace(/^\uFEFF/, "");

    // Try to find where the JSON might be truncated or malformed
    try {
      // If it's an array, try to fix truncated arrays
      if (fixedText.trim().startsWith("[")) {
        const lastValidIndex = fixedText.lastIndexOf("}");
        if (lastValidIndex > -1) {
          const potentialFix = fixedText.substring(0, lastValidIndex + 1) + "]";
          return JSON.parse(potentialFix);
        }
      }
    } catch (fixError) {
      console.error("Failed to auto-fix JSON:", fixError);
    }

    throw new Error(
      `Invalid JSON response: ${
        typeof error === "object" && error !== null && "message" in error
          ? (error as { message: string }).message
          : String(error)
      }`
    );
  }
}

async function getPost(slug: string): Promise<BlogPost | null> {
  try {
    const response = await fetchWithRetry(
      `https://hedgewithcrypto.com/wp-json/wp/v2/posts?slug=${encodeURIComponent(
        slug
      )}&_embed`
    );

    const posts: WordPressPost[] = await safeJsonParse(response);

    if (!Array.isArray(posts) || !posts.length) {
      console.warn(`No posts found for slug: ${slug}`);
      return null;
    }

    const post = posts[0];

    // Validate required fields
    if (!post.slug || !post.title?.rendered || !post.content?.rendered) {
      console.error("Post missing required fields:", post);
      return null;
    }

    return {
      slug: post.slug,
      content: he.decode(post.content.rendered || ""),
      metadata: {
        title: he.decode(post.title.rendered || "Untitled"),
        publishedAt: post.date || new Date().toISOString(),
        summary: he.decode(
          (post.excerpt?.rendered || "").replace(/<[^>]*>/g, "").trim() ||
            "No summary available"
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
  try {
    console.log("Fetching posts for static generation...");

    const response = await fetchWithRetry(
      "https://hedgewithcrypto.com/wp-json/wp/v2/posts?authors=12&per_page=100&_fields=slug,id"
    );

    const posts: Pick<WordPressPost, "slug" | "id">[] = await safeJsonParse(
      response
    );

    if (!Array.isArray(posts)) {
      console.error("Expected array of posts, got:", typeof posts);
      return [];
    }

    const validPosts = posts.filter(
      (post) => post.slug && typeof post.slug === "string"
    );

    console.log(
      `Successfully fetched ${validPosts.length} posts for static generation`
    );

    return validPosts.map((post) => ({
      slug: post.slug,
    }));
  } catch (error) {
    console.error("Error in generateStaticParams:", error);

    // Return empty array to prevent build failure
    // This allows the build to continue, but pages will be generated on-demand
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata | undefined> {
  try {
    const post = await getPost(params.slug);
    if (!post) return undefined;

    const ogImage =
      post.metadata.image ||
      `${DATA.url}/og?title=${encodeURIComponent(post.metadata.title)}`;

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
  } catch (error) {
    console.error("Error generating metadata:", error);
    return undefined;
  }
}

export default async function Blog({ params }: { params: { slug: string } }) {
  const post = await getPost(params.slug);
  if (!post) {
    console.error(`Post not found: ${params.slug}`);
    notFound();
  }

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
              `${DATA.url}/og?title=${encodeURIComponent(post.metadata.title)}`,
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
