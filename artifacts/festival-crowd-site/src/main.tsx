import { createRoot } from "react-dom/client";
import { setBaseUrl } from "@workspace/api-client-react";
import App from "./App";
import "./index.css";

// When deployed to a separate host (e.g. Vercel), set VITE_API_BASE_URL to
// the Replit API origin (e.g. https://xxx.replit.app) so that API calls
// resolve to the correct server instead of the frontend host.
const apiBase = import.meta.env.VITE_API_BASE_URL as string | undefined;
if (apiBase) {
  setBaseUrl(apiBase.replace(/\/+$/, ""));
}

createRoot(document.getElementById("root")!).render(<App />);
