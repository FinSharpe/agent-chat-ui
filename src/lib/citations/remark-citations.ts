import { CITATION_MARKER } from "./resolve";

/**
 * A remark plugin that turns each canonical `[[tag]]` in the prose into an
 * inline node the renderer draws as a numbered chip.
 *
 * Only markers the resolution pass kept ever reach here — it strips the rest
 * from the text first and normalises every survivor to canonical form — so this
 * pattern is deliberately stricter than the one used to find markers.
 *
 * Running as a markdown plugin rather than a post-pass over rendered output is
 * what makes streaming work with no streaming-specific path: the markdown
 * re-parses on every render, so a marker becomes a chip the moment its closing
 * brackets arrive.
 *
 * The chip is emitted as a `<span data-citation-tag>` so it travels through the
 * standard mdast → hast conversion and is picked up by the `span` renderer,
 * with no custom element names to keep in sync.
 */

/** Structural subset of mdast — `@types/mdast` is not a dependency here. */
interface MdastNode {
  type: string;
  value?: string;
  children?: MdastNode[];
  data?: { hName?: string; hProperties?: Record<string, unknown> };
}

export const CITATION_TAG_ATTRIBUTE = "data-citation-tag";

function citationNode(tag: string): MdastNode {
  return {
    type: "citationReference",
    data: {
      hName: "span",
      hProperties: { [CITATION_TAG_ATTRIBUTE]: tag },
    },
  };
}

/** Split one text node around its markers, or return null when it has none. */
function splitText(node: MdastNode): MdastNode[] | null {
  const value = node.value;
  if (!value || !value.includes("[[")) return null;

  const out: MdastNode[] = [];
  let last = 0;
  // `matchAll` on a sticky-free global regex is safe to re-enter; the shared
  // pattern's lastIndex is never carried between calls.
  for (const match of value.matchAll(CITATION_MARKER)) {
    if (match.index > last) {
      out.push({ type: "text", value: value.slice(last, match.index) });
    }
    out.push(citationNode(match[1]));
    last = match.index + match[0].length;
  }
  if (out.length === 0) return null;
  if (last < value.length) {
    out.push({ type: "text", value: value.slice(last) });
  }
  return out;
}

function transform(node: MdastNode): void {
  const children = node.children;
  if (!children) return;

  let replaced: MdastNode[] | null = null;
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    if (child.type === "text") {
      const parts = splitText(child);
      if (parts) {
        replaced ??= children.slice();
        // Offset by how far earlier replacements have already grown the list.
        const at = replaced.indexOf(child);
        replaced.splice(at, 1, ...parts);
      }
      continue;
    }
    transform(child);
  }

  if (replaced) node.children = replaced;
}

export function remarkCitations() {
  return (tree: MdastNode) => transform(tree);
}
