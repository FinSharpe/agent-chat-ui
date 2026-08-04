import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";

import {
  CITATION_TAG_ATTRIBUTE,
  remarkCitations,
} from "@/lib/citations/remark-citations";

const components: any = {
  span: ({ node: _n, children, ...props }: any) => {
    const tag = props[CITATION_TAG_ATTRIBUTE];
    if (typeof tag !== "string") return <span {...props}>{children}</span>;
    return <button data-chip={tag}>#{tag.slice(0, 3)}</button>;
  },
};

function render(md: string) {
  return renderToStaticMarkup(
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkCitations]}
      rehypePlugins={[rehypeRaw]}
      components={components}
    >
      {md}
    </ReactMarkdown>,
  );
}

const cases: [string, string][] = [
  ["prose chip", "Margins held[[aaaaaaaaaa]]. Orders grew[[bbbbbbbbbb]]."],
  ["chip in a list item", "- Revenue rose[[aaaaaaaaaa]]\n- Costs fell"],
  ["chip inside bold", "**Margins held[[aaaaaaaaaa]]** overall."],
  ["chip in a table cell", "| a | b |\n|---|---|\n| x[[aaaaaaaaaa]] | y |"],
  ["marker in code untouched", "Use `[[aaaaaaaaaa]]` verbatim."],
  ["heading chip", "## Guidance[[aaaaaaaaaa]]"],
];

let failures = 0;
for (const [name, md] of cases) {
  const html = render(md);
  console.log(`--- ${name}\n${html}`);
  if (name === "marker in code untouched") {
    if (!html.includes("[[aaaaaaaaaa]]") || html.includes("data-chip")) {
      failures++;
      console.log("  FAIL: code span was rewritten");
    }
  } else if (!html.includes('data-chip="aaaaaaaaaa"')) {
    failures++;
    console.log("  FAIL: no chip rendered");
  }
  if (name !== "marker in code untouched" && html.includes("[[")) {
    failures++;
    console.log("  FAIL: raw marker leaked");
  }
}

console.log(failures === 0 ? "\nALL PASS" : `\n${failures} FAILURE(S)`);
process.exit(failures === 0 ? 0 : 1);
