import type { ReactNode } from "react";
import { EditorProvider } from "../state/StateContext";
import { EditorUiProvider } from "./EditorUiContext";
import { ThemeProvider } from "./ThemeProvider";
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <EditorProvider>
        <EditorUiProvider>{children}</EditorUiProvider>
      </EditorProvider>
    </ThemeProvider>
  );
}
