import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { PrdDraftProvider } from "@/state/prdDraft";
import "./styles/prd.css";

const root = document.getElementById("root");

if (!root) {
  throw new Error("Missing #root element");
}

createRoot(root).render(
  <StrictMode>
    <PrdDraftProvider>
      <App />
    </PrdDraftProvider>
  </StrictMode>
);
