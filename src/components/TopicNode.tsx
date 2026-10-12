"use client";

import { Handle, Position, type NodeProps, type Node } from "@xyflow/react";
import type { Topic } from "@/data/roadmap";

export type TopicNodeData = {
  topic: Topic;
  solvedCount: number;
};

export type TopicNodeType = Node<TopicNodeData, "topic">;

export default function TopicNode({ data, selected }: NodeProps<TopicNodeType>) {
  const { topic, solvedCount } = data;
  const total = topic.problems.length;
  const pct = total === 0 ? 0 : (solvedCount / total) * 100;
  const done = solvedCount === total && total > 0;

  return (
    <div
      className={`group relative min-w-[190px] max-w-[230px] cursor-pointer rounded-xl px-5 pb-3.5 pt-3 text-center transition
        ${done ? "border border-white bg-white text-black" : "border border-neutral-800 bg-[#0a0a0a] text-white"}
        ${selected ? "ring-2 ring-white/80" : "hover:border-neutral-500"}`}
    >
      <Handle type="target" position={Position.Top} className="!h-1 !w-1 !border-0 !bg-transparent" />
      <div className="text-[16px] font-semibold leading-snug tracking-[-0.01em]">{topic.title}</div>
      <div className={`mt-2.5 h-[4px] w-full overflow-hidden rounded-full ${done ? "bg-black/20" : "bg-neutral-800"}`}>
        <div
          className={`h-full rounded-full ${done ? "bg-black" : "bg-white"} transition-[width] duration-300`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="pointer-events-none absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[11px] font-mono text-white/60 opacity-0 transition group-hover:opacity-100">
        {solvedCount} / {total}
      </div>
      <Handle type="source" position={Position.Bottom} className="!h-1 !w-1 !border-0 !bg-transparent" />
    </div>
  );
}
