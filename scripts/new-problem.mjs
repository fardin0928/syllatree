#!/usr/bin/env node
// Usage: npm run new-problem <slug> ["Title"]
import { mkdirSync, existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const [slug, titleArg] = process.argv.slice(2);
if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
  console.error("usage: npm run new-problem <slug> [\"Title\"]   (slug: lowercase, digits, dashes)");
  process.exit(1);
}
const dir = join(process.cwd(), "problems", slug);
if (existsSync(dir)) {
  console.error(`problems/${slug} already exists`);
  process.exit(1);
}
const title = titleArg ?? slug.split("-").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");

mkdirSync(join(dir, "tests"), { recursive: true });
const w = (name, body) => writeFileSync(join(dir, name), body);

w("problem.json", JSON.stringify({
  title, difficulty: "Easy", topic: "", tags: [], timeLimitMs: 2000,
  inputFormat: "Line 1: n\nLine 2: n integers", order: 100,
  published: false, publishAt: null, solutionPublished: false,
}, null, 2) + "\n");
w("description.md", `Describe **${title}** here.\n\n### Example 1\n\n\`\`\`\nInput: nums = [1,2,3]\nOutput: 6\n\`\`\`\n\n### Constraints\n\n- \`1 <= n <= 10^5\`\n`);
w("starter.cpp", `#include <vector>\nusing namespace std;\n\nclass Solution {\npublic:\n    int solve(vector<int>& nums) {\n        \n    }\n};\n`);
w("harness.cpp", `#include <iostream>\n#include <vector>\n#include "solution.cpp"\n\nint main() {\n    int n;\n    std::cin >> n;\n    std::vector<int> nums(n);\n    for (auto& x : nums) std::cin >> x;\n    std::cout << Solution().solve(nums) << '\\n';\n}\n`);
w("solution.cpp", `#include <vector>\nusing namespace std;\n\nclass Solution {\npublic:\n    int solve(vector<int>& nums) {\n        int s = 0;\n        for (int x : nums) s += x;\n        return s;\n    }\n};\n`);
w("tests/sample1.in", "3\n1 2 3\n");
w("tests/sample1.out", "6\n");
w("tests/hidden1.in", "1\n-5\n");
w("tests/hidden1.out", "-5\n");

console.log(`created problems/${slug}/ as a DRAFT. Edit the files, then publish it from /whoami.`);
