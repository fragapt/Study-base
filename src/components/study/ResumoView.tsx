"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// Renders a resumo's Markdown with the app's dark palette. No typography plugin —
// element styles are supplied inline so we don't add Tailwind config.
export default function ResumoView({ markdown }: { markdown: string }) {
  return (
    <div className="text-[13.5px] leading-relaxed text-fg">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: (p) => <h1 className="mb-2 mt-4 text-base font-bold first:mt-0" {...p} />,
          h2: (p) => <h2 className="mb-2 mt-4 text-[15px] font-semibold first:mt-0" {...p} />,
          h3: (p) => <h3 className="mb-1.5 mt-3 text-sm font-semibold first:mt-0" {...p} />,
          p: (p) => <p className="mb-2.5" {...p} />,
          ul: (p) => <ul className="mb-2.5 ml-4 list-disc space-y-1" {...p} />,
          ol: (p) => <ol className="mb-2.5 ml-4 list-decimal space-y-1" {...p} />,
          li: (p) => <li className="pl-0.5" {...p} />,
          strong: (p) => <strong className="font-semibold text-fg" {...p} />,
          a: (p) => <a className="text-accent hover:underline" {...p} />,
          code: (p) => (
            <code className="rounded bg-card2 px-1 py-0.5 text-[12px] text-orange" {...p} />
          ),
          blockquote: (p) => (
            <blockquote className="my-2 border-l-2 border-edge pl-3 text-muted" {...p} />
          ),
          table: (p) => (
            <div className="my-2 overflow-x-auto">
              <table className="w-full border-collapse text-[12.5px]" {...p} />
            </div>
          ),
          th: (p) => <th className="border border-edge2 px-2 py-1 text-left font-semibold" {...p} />,
          td: (p) => <td className="border border-edge2 px-2 py-1" {...p} />,
          hr: () => <hr className="my-3 border-edge2" />,
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
