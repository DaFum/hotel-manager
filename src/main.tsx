import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app/App";
import { ContentEditorApp } from "./tools/content-editor/ContentEditorApp";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {window.location.pathname === "/tools/content-editor" ? (
      <ContentEditorApp />
    ) : (
      <App />
    )}
  </StrictMode>,
);
