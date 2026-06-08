import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import mdx from "@mdx-js/rollup";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkFrontmatter from "remark-frontmatter";
import remarkMdxFrontmatter from "remark-mdx-frontmatter";
import rehypeKatex from "rehype-katex";
import rehypePrism from "rehype-prism-plus";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import remarkShortcodes from "./src/lib/remarkShortcodes";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    mdx({
      remarkPlugins: [
        remarkGfm as any,
        remarkMath as any,
        remarkFrontmatter as any,
        [remarkMdxFrontmatter, { name: "frontmatter" }] as any,
        remarkShortcodes as any,
      ] as any,
      rehypePlugins: [rehypeSlug, rehypeAutolinkHeadings, rehypeKatex, rehypePrism] as any,
    }),
    react({ development: mode === 'development' }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
