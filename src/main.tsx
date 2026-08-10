import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app/App";
import { ContentEditorApp } from "./tools/content-editor/ContentEditorApp";
import { ErrorBoundary } from "./app/ErrorBoundary";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      {window.location.pathname === "/tools/content-editor" ? (
        <ContentEditorApp />
      ) : (
        <App />
      )}
    </ErrorBoundary>
  </StrictMode>,
);
