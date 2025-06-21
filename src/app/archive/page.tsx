import { fetchBlogPosts } from "@/lib/wp-client";
import { InfiniteScrollPosts } from "@/components/infinite-scroll-posts";

export const metadata = {
  title: "Crypto Contents Archive",
};

export default async function CryptoNewsPage() {
  const initialPosts = await fetchBlogPosts(1);
  return (
    <InfiniteScrollPosts
      initialPosts={initialPosts}
      apiPath="/api/blog-posts"
      basePath="archive"
    />
  );
}
