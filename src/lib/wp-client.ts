import he from "he";

interface WordPressPost {
  slug: string;
  title: {
    rendered: string;
  };
  date: string;
}

export interface BlogPost {
  slug: string;
  metadata: {
    title: string;
    publishedAt: string;
  };
}

export async function fetchBlogPosts(page: number = 1): Promise<BlogPost[]> {
  try {
    const res = await fetch(
      `https://cryptonews.com/wp-json/wp/v2/posts?author=328&per_page=100&page=${page}`,
      { cache: "no-store" }
    );

    if (!res.ok) throw new Error(`Failed to fetch posts: ${res.status}`);

    const posts: WordPressPost[] = await res.json();

    // Filter out posts after May 19, 2025 (UTC)
    const cutoffDate = new Date("2025-06-20"); // May 19th 00:00:00 UTC
    const filteredPosts = posts.filter(
      (post) => new Date(post.date) < cutoffDate
    );

    return filteredPosts.map((post) => ({
      slug: post.slug,
      metadata: {
        title: he.decode(post.title.rendered),
        publishedAt: new Date(post.date).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
      },
    }));
  } catch (error) {
    console.error("Error fetching posts:", error);
    return [];
  }
}

export async function fetchEsportsInsider(
  page: number = 1
): Promise<BlogPost[]> {
  try {
    const res = await fetch(
      `https://esportsinsider.com/wp-json/wp/v2/posts?author=291&per_page=100&page=${page}`,
      { cache: "no-store" } // Disable caching for large responses
    );

    if (!res.ok) throw new Error(`Failed to fetch posts: ${res.status}`);

    const posts: WordPressPost[] = await res.json();

    const cutoffDate = new Date("2025-06-19"); // May 19th 00:00:00 UTC
    const filteredPosts = posts.filter(
      (post) => new Date(post.date) < cutoffDate
    );

    return filteredPosts.map((post) => ({
      slug: post.slug,
      metadata: {
        title: he.decode(post.title.rendered),
        publishedAt: new Date(post.date).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
      },
    }));
  } catch (error) {
    console.error("Error fetching posts:", error);
    return [];
  }
}

//https://hedgewithcrypto.com/wp-json/wp/v2/posts?authors=12

export async function fetchHedgeWithCrypto(
  page: number = 1
): Promise<BlogPost[]> {
  try {
    const res = await fetch(
      `https://hedgewithcrypto.com/wp-json/wp/v2/posts?authors=12&per_page=100&page=${page}`,
      { cache: "no-store" } // Disable caching for large responses
    );

    if (!res.ok) throw new Error(`Failed to fetch posts: ${res.status}`);

    const posts: WordPressPost[] = await res.json();

    const cutoffDate = new Date("2025-05-26"); // May 26th 00:00:00 UTC
    const filteredPosts = posts.filter(
      (post) => new Date(post.date) < cutoffDate
    );

    return filteredPosts.map((post) => ({
      slug: post.slug,
      metadata: {
        title: he.decode(post.title.rendered),
        publishedAt: new Date(post.date).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
      },
    }));
  } catch (error) {
    console.error("Error fetching posts:", error);
    return [];
  }
}
