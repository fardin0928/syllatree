# Problem bank

Each folder here is one problem. The folder name is the slug used in the URL (`/problems/<slug>`).

```
problems/
  two-sum/
    problem.json      # metadata (title, difficulty, topic, tags, time limit, ...)
    description.md    # statement shown to students (Markdown, GFM)
    starter.cpp       # code the student starts with (class Solution stub)
    harness.cpp       # OPTIONAL. main() that reads stdin, calls Solution, prints answer.
                      #   It must `#include "solution.cpp"`. If absent, the student's
                      #   code is compiled as-is and must define main() (stdin/stdout style).
    solution.cpp      # OPTIONAL. Used to auto-generate expected outputs. Sent to
                      #   students only while solutionPublished is true.
    tests/
      sample1.in      # input piped to stdin
      sample1.out     # expected stdout
      hidden1.in
      hidden1.out
```

Test naming: files whose name starts with `sample` are public. Students see their
input/expected/actual output. Everything else is hidden: students only see pass/fail.

`problem.json` fields:

| field         | type                         | notes                                   |
| ------------- | ---------------------------- | --------------------------------------- |
| title         | string                       | required                                |
| difficulty    | "Easy" \| "Medium" \| "Hard" | required                                |
| topic         | string                       | roadmap topic id, e.g. `arrays`         |
| tags          | string[]                     | free-form                               |
| timeLimitMs   | number                       | per test, default 2000                  |
| inputFormat   | string                       | shown next to the custom-input box      |
| extraFlags    | string[]                     | extra clang++ flags, e.g. ["-fsanitize=address","-g"] to turn iterator misuse into a loud runtime error |
| order         | number                       | sort key in the problem list            |
| published     | boolean                      | students see it only when true (toggle from /whoami) |
| publishAt     | string \| null               | ISO datetime; auto-publishes when the time passes |
| solutionPublished | boolean                  | show solution.cpp under a "Solution" tab (toggle from /whoami) |

Three ways to add a problem:

1. Web UI: `/whoami/new` (needs `ADMIN_KEY` from `.env.local`, or just run `next dev`).
2. CLI: `npm run new-problem <slug>` scaffolds the folder, then edit the files.
3. Copy an existing folder and edit.

Output comparison ignores trailing whitespace on each line and trailing blank lines.
