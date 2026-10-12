"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Background,
  BackgroundVariant,
  Controls,
  ReactFlow,
  ReactFlowProvider,
  getViewportForBounds,
  useReactFlow,
  type Edge,
  type NodeMouseHandler,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { LINKS, TOPICS, TOPIC_BY_ID, type Topic } from "@/data/roadmap";
import { useProgress } from "@/lib/progress";
import TopicNode, { type TopicNodeType } from "./TopicNode";
import TopicSidebar from "./TopicSidebar";
import StatsPanel from "./StatsPanel";
import UpcomingPanel from "./UpcomingPanel";
import type { ProblemMeta } from "@/lib/problems";

const nodeTypes = { topic: TopicNode };

const NODE_W = 230;
const NODE_H = 72;
const RAIL_W = 380; // right panel column

const BOUNDS = (() => {
  const xs = TOPICS.map((t) => t.position.x);
  const ys = TOPICS.map((t) => t.position.y);
  const x = Math.min(...xs);
  const y = Math.min(...ys);
  return {
    x,
    y,
    width: Math.max(...xs) + NODE_W - x,
    height: Math.max(...ys) + NODE_H - y,
  };
})();

const edges: Edge[] = LINKS.map(([source, target]) => ({
  id: `${source}-${target}`,
  source,
  target,
  type: "smoothstep",
  pathOptions: { borderRadius: 60 },
  style: { stroke: "#8b8b8b", strokeWidth: 1.5 },
}));

function Canvas({ localSlugs, authSlot }: { localSlugs: Set<string>; authSlot?: React.ReactNode }) {
  const { solved } = useProgress();
  const [openId, setOpenId] = useState<string | null>(null);
  const { setViewport } = useReactFlow();

  // Center the graph inside the canvas area that the right rail leaves free.
  const center = useCallback(() => {
    const width = Math.max(window.innerWidth - RAIL_W, 320);
    setViewport(getViewportForBounds(BOUNDS, width, window.innerHeight, 0.2, 2, "2%"));
  }, [setViewport]);

  useEffect(() => {
    window.addEventListener("resize", center);
    return () => window.removeEventListener("resize", center);
  }, [center]);

  const solvedByTopic = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of TOPICS) {
      map.set(t.id, t.problems.filter((p) => solved.has(`${t.id}/${p.slug}`)).length);
    }
    return map;
  }, [solved]);

  const nodes: TopicNodeType[] = useMemo(
    () =>
      TOPICS.map((topic) => ({
        id: topic.id,
        type: "topic" as const,
        position: topic.position,
        data: { topic, solvedCount: solvedByTopic.get(topic.id) ?? 0 },
      })),
    [solvedByTopic],
  );

  const onNodeClick: NodeMouseHandler = useCallback((_, node) => setOpenId(node.id), []);
  const openTopic: Topic | null = openId ? TOPIC_BY_ID.get(openId) ?? null : null;

  return (
    <div className="h-dvh w-full overflow-hidden bg-[#17181a]">
      <header className="pointer-events-none absolute left-0 top-0 z-10 p-5">
        <div className="pointer-events-auto">
          <h1 className="text-lg font-semibold tracking-tight text-white">chill335</h1>
          <p className="text-xs text-neutral-400">Drag to pan &middot; scroll to zoom &middot; click a topic</p>
        </div>
      </header>

      <div className="pointer-events-none absolute right-0 top-0 z-10 flex h-full w-[360px] max-w-[90vw] flex-col gap-4 overflow-y-auto p-5">
        <div className="pointer-events-auto flex flex-col gap-4">
          <StatsPanel authSlot={authSlot} />
          <UpcomingPanel />
        </div>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodeClick={onNodeClick}
        onPaneClick={() => setOpenId(null)}
        onInit={center}
        minZoom={0.2}
        maxZoom={2}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={26} size={2.2} color="#8b929c" bgColor="#17181a" />
        <Controls showInteractive={false} className="!bottom-6 !left-6" />
      </ReactFlow>

      <TopicSidebar topic={openTopic} onClose={() => setOpenId(null)} localSlugs={localSlugs} />
    </div>
  );
}

export default function RoadmapCanvas({
  problems = [],
  authSlot,
}: {
  problems?: ProblemMeta[];
  /** Server-rendered sign-in / account button, shown at the top of the stats card. */
  authSlot?: React.ReactNode;
}) {
  const local = useMemo(() => new Set(problems.map((p) => p.slug)), [problems]);
  return (
    <ReactFlowProvider>
      <Canvas localSlugs={local} authSlot={authSlot} />
    </ReactFlowProvider>
  );
}
