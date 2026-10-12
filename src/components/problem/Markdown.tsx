import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function Markdown({ source }: { source: string }) {
  return (
    <div className="prose prose-invert prose-base max-w-none text-[16px] leading-7 prose-h3:text-lg prose-code:text-[15px] prose-pre:bg-[#0f0f10] prose-pre:border prose-pre:border-neutral-800 prose-code:before:content-none prose-code:after:content-none prose-code:rounded prose-code:bg-white/10 prose-code:px-1 prose-code:py-0.5 prose-code:font-normal prose-headings:font-semibold prose-h3:mt-7">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{source}</ReactMarkdown>
    </div>
  );
}
