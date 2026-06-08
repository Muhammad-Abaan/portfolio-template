import type { Plugin } from "unified";
import { visit } from "unist-util-visit";

// Transform {{Chart id="sales"}} into <Chart id="sales" /> (flow-level when alone in a paragraph)
const remarkShortcodes: Plugin = () => {
  return (tree: any) => {
    // Flow-level: paragraph containing only the shortcode
    visit(tree as any, "paragraph", (node: any, index: any, parent: any) => {
      if (!parent || typeof index !== "number" || !node.children || node.children.length !== 1) return;
      const child = node.children[0];
      if (child.type !== "text") return;
      const value: string = String(child.value).trim();
      const m = value.match(/^{{\s*Chart\s+id="([^"]+)"\s*}}$/);
      if (!m) return;
      const id = m[1];
      parent.children.splice(index, 1, {
        type: "mdxJsxFlowElement",
        name: "Chart",
        attributes: [{ type: "mdxJsxAttribute", name: "id", value: id }],
        children: [],
      });
    });

    // Inline-level: fallback for text nodes containing shortcode amongst other text
    visit(tree as any, "text", (node: any, index: any, parent: any) => {
      if (typeof index !== "number" || !parent) return;
      const value: string = node.value;
      const regex = /{{\s*Chart\s+id="([^"]+)"\s*}}/g;
      let match: RegExpExecArray | null;
      let lastIndex = 0;
      const newNodes: any[] = [];

      while ((match = regex.exec(value))) {
        const [full, id] = match;
        if (match.index > lastIndex) {
          newNodes.push({ type: "text", value: value.slice(lastIndex, match.index) });
        }
        newNodes.push({
          type: "mdxJsxTextElement",
          name: "Chart",
          attributes: [{ type: "mdxJsxAttribute", name: "id", value: id }],
          children: [],
        });
        lastIndex = match.index + full.length;
      }

      if (newNodes.length) {
        if (lastIndex < value.length) newNodes.push({ type: "text", value: value.slice(lastIndex) });
        parent.children.splice(index, 1, ...newNodes);
      }
    });
  };
};

export default remarkShortcodes;
