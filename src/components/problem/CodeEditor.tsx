"use client";

import CodeMirror from "@uiw/react-codemirror";
import { cpp } from "@codemirror/lang-cpp";
import { vscodeDark } from "@uiw/codemirror-theme-vscode";
import { EditorView } from "@codemirror/view";
import { useMemo } from "react";

// VS Code "Dark+" colours; only layout + font are overridden here.
const bg = EditorView.theme({
  "&": { height: "100%" },
  ".cm-scroller": { fontFamily: "var(--font-geist-mono), ui-monospace, monospace", fontSize: "15px" },
});

export default function CodeEditor({
  value,
  onChange,
  readOnly = false,
  minHeight,
}: {
  value: string;
  onChange?: (v: string) => void;
  readOnly?: boolean;
  minHeight?: string;
}) {
  const extensions = useMemo(() => [cpp(), bg, EditorView.lineWrapping], []);
  return (
    <CodeMirror
      value={value}
      onChange={onChange}
      readOnly={readOnly}
      theme={vscodeDark}
      extensions={extensions}
      height="100%"
      minHeight={minHeight}
      className="h-full"
      basicSetup={{ tabSize: 4, foldGutter: false, highlightActiveLine: !readOnly }}
    />
  );
}
