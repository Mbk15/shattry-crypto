import { fetchHedgeWithCrypto } from "@/lib/wp-client";
import { InfiniteScrollPosts } from "@/components/infinite-scroll-posts";

export const metadata = {
  title: "AI Posts",
};

export default async function AIPostsPage() {
  const initialPosts = await fetchHedgeWithCrypto(1);
  return (
    <InfiniteScrollPosts
      initialPosts={initialPosts}
      apiPath="/api/hwc-posts"
      basePath="hwc-articles"
    />
  );
}
