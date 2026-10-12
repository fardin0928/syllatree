export type Difficulty = "Easy" | "Medium" | "Hard";

export type Problem = {
  title: string;
  difficulty: Difficulty;
  /** LeetCode slug. If a folder with the same name exists in problems/, the roadmap links to the in-app C++ workspace instead. */
  slug: string;
};

export type Prereq = {
  title: string;
  /** Shown under the title on the concept card - use it to group concepts (lecture, subtopic, ...). */
  course: string;
};

export type Topic = {
  id: string; // stable key: used by saved progress and problem.json "topic". Do not rename.
  title: string; // display name - safe to change
  position: { x: number; y: number };
  prereqs: Prereq[];
  problems: Problem[];
};

const p = (title: string, difficulty: Difficulty, slug: string): Problem => ({
  title,
  difficulty,
  slug,
});

const c = (course: string, ...titles: string[]): Prereq[] =>
  titles.map((title) => ({ title, course }));

/**
 * CSCI 335 roadmap. Main spine runs top to bottom; side nodes are sub-topics.
 * Positions are canvas coordinates (node is ~230x72).
 */
export const TOPICS: Topic[] = [
  // ---- 1. C++ / STL ----
  {
    id: "stl",
    title: "C++ / STL Foundations",
    position: { x: 400, y: 0 },
    prereqs: [
      ...c("Containers", "vector", "list"),
      ...c(
        "Iterators",
        "iterators",
        "random-access vs bidirectional iterators",
      ),
      ...c("Modifying", "insert / erase", "iterator invalidation"),
      ...c("Big Five", "destructor", "copy constructor", "copy assignment", "move constructor", "move assignment"),
    ],
    problems: [
      p("Erase Evens with Iterators", "Easy", "iter-erase-evens"),
      p("Insert After Every Match (std::list)", "Easy", "iter-list-insert-after"),
      p("Append While Iterating", "Medium", "iter-append-while-iterating"),
      p("Big Five 1: Destructor", "Easy", "big5-destructor"),
      p("Big Five 2: Copy Constructor", "Easy", "big5-copy-constructor"),
      p("Big Five 3: Copy Assignment", "Medium", "big5-copy-assignment"),
      p("Big Five 4: Move Constructor", "Medium", "big5-move-constructor"),
      p("Big Five 5: Move Assignment", "Medium", "big5-move-assignment"),
      p("Big Five: Rule of Five (all together)", "Hard", "big5-rule-of-five"),
    ],
  },

  // ---- 2. Arrays ----
  {
    id: "arrays",
    title: "Arrays & In-Place Techniques",
    position: { x: 400, y: 150 },
    prereqs: c(
      "In-place",
      "Two pointers",
      "shifting elements",
      "overwriting elements",
    ),
    problems: [p("Remove Element", "Easy", "remove-element")],
  },

  // ---- 3. Heaps ----
  {
    id: "heaps",
    title: "Heaps / Priority Queues",
    position: { x: 400, y: 300 },
    prereqs: [
      ...c(
        "Structure",
        "Min Heap",
        "Max Heap",
        "heap properties",
        "min-max heap",
      ),
      ...c(
        "Operations",
        "insert / percUp",
        "deleteMin / deleteMax",
        "percDown",
        "buildHeap",
      ),
    ],
    problems: [],
  },
  {
    id: "top-k",
    title: "Top K",
    position: { x: 720, y: 300 },
    prereqs: c("Heaps", "Top K with a heap"),
    problems: [],
  },

  // ---- 4. Sorting ----
  {
    id: "sorting",
    title: "Sorting",
    position: { x: 400, y: 450 },
    prereqs: [
      ...c("Algorithms", "Insertion Sort", "Heap Sort", "Merge Sort"),
      ...c("Complexity", "best case", "average case", "worst case"),
    ],
    problems: [],
  },
  {
    id: "quick-sort",
    title: "Quick Sort",
    position: { x: 720, y: 450 },
    prereqs: c("Quick Sort", "partition", "pivot", "median-of-three"),
    problems: [],
  },

  // ---- 5. Graphs ----
  {
    id: "graphs",
    title: "Graphs",
    position: { x: 400, y: 600 },
    prereqs: c("Graphs", "representation", "cycle detection / Union-Find idea"),
    problems: [],
  },
  {
    id: "topological-sort",
    title: "Topological Sort",
    position: { x: 80, y: 750 },
    prereqs: c("Topological Sort", "DAGs", "Kahn's algorithm / DFS order"),
    problems: [],
  },
  {
    id: "mst",
    title: "Minimum Spanning Tree",
    position: { x: 400, y: 750 },
    prereqs: c("MST", "Prim's", "Kruskal's"),
    problems: [],
  },
  {
    id: "shortest-path",
    title: "All-Pairs Shortest Path",
    position: { x: 720, y: 750 },
    prereqs: c("Shortest Path", "Floyd-Warshall", "Johnson's Algorithm"),
    problems: [],
  },

  // ---- 6. DP ----
  {
    id: "dp",
    title: "Dynamic Programming",
    position: { x: 400, y: 900 },
    prereqs: c("DP", "overlapping subproblems", "memoization vs tabulation"),
    problems: [],
  },
  {
    id: "dp-1d",
    title: "1D DP",
    position: { x: 80, y: 1050 },
    prereqs: c("1D DP", "state = index", "recurrence"),
    problems: [],
  },
  {
    id: "dp-2d",
    title: "2D DP",
    position: { x: 400, y: 1050 },
    prereqs: c("2D DP", "grid state", "transition from neighbours"),
    problems: [],
  },
  {
    id: "dp-construction",
    title: "DP Construction",
    position: { x: 720, y: 1050 },
    prereqs: c("Previous-State Pattern", "build row i from row i-1"),
    problems: [],
  },
];

/** Arrows on the canvas: [from, to]. */
export const LINKS: [string, string][] = [
  ["stl", "arrays"],
  ["arrays", "heaps"],
  ["heaps", "top-k"],
  ["heaps", "sorting"],
  ["sorting", "quick-sort"],
  ["sorting", "graphs"],
  ["graphs", "topological-sort"],
  ["graphs", "mst"],
  ["graphs", "shortest-path"],
  ["graphs", "dp"],
  ["dp", "dp-1d"],
  ["dp", "dp-2d"],
  ["dp", "dp-construction"],
];

export const TOPIC_BY_ID = new Map(TOPICS.map((t) => [t.id, t]));
export const TOTAL_PROBLEMS = TOPICS.reduce((n, t) => n + t.problems.length, 0);
