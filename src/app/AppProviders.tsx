import type { ReactNode } from "react";
import { EditorProvider } from "../state/StateContext";
import { ThemeProvider } from "./ThemeProvider";
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <EditorProvider>{children}</EditorProvider>
    </ThemeProvider>
  );
}
