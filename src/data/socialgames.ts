import fs from "fs";
import matter from "gray-matter";
import path from "path";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import remarkEmbedder from "@remark-embedder/core";
import oembedTransformer from "@remark-embedder/transformer-oembed";

type Metadata = {
  title: string;
  publishedAt: string;
  summary: string;
  image?: string;
};

function getMDXFiles(dir: string) {
  return fs.readdirSync(dir).filter((file) => path.extname(file) === ".mdx");
}

export async function markdownToHTML(markdown: string) {
  const p = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkEmbedder, {
      transformers: [[oembedTransformer, {}]],
    })
    .use(remarkRehype)
    .use(rehypePrettyCode, {
      theme: { light: "min-light", dark: "min-dark" },
      keepBackground: false,
    })
    .use(rehypeStringify)
    .process(markdown);

  return p.toString();
}

export async function getPost(slug: string) {
  // <-- point at content/socialgames now
  const filePath = path.join(
    process.cwd(),
    "content",
    "socialgames",
    `${slug}.mdx`
  );
  const sourceRaw = fs.readFileSync(filePath, "utf-8");
  const { content: rawContent, data: metadata } = matter(sourceRaw);
  const content = await markdownToHTML(rawContent);

  return {
    source: content,
    metadata: metadata as Metadata,
    slug,
  };
}

async function getAllPosts(dir: string) {
  const mdxFiles = getMDXFiles(dir);
  return Promise.all(
    mdxFiles.map(async (file) => {
      const slug = path.basename(file, ".mdx");
      const { metadata, source } = await getPost(slug);
      return { metadata, slug, source };
    })
  );
}

// <-- renamed to getSocialGamePosts for clarity
export async function getSocialGamePosts() {
  const socialDir = path.join(process.cwd(), "content", "socialgames");
  return getAllPosts(socialDir);
}
