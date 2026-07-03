import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ErrorBoundary } from "./components/ErrorBoundary.jsx";
import "./index.css";

const root = createRoot(document.getElementById("root"));

// Firebase's SDK initializes eagerly on import and throws synchronously on a
// missing/invalid API key, which would otherwise crash to a blank white page
// before React ever mounts. Guard with a dynamic import so an unconfigured
// .env shows a clear setup message instead.
if (!import.meta.env.VITE_FIREBASE_API_KEY) {
  root.render(
    <div className="login-shell">
      <div className="card login-card" style={{ width: 420 }}>
        <h1 style={{ fontSize: 18, marginTop: 0 }}>Firebase not configured</h1>
        <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>
          Copy <code>.env.example</code> to <code>.env</code>, fill in your Firebase web app
          config, and restart the dev server.
        </p>
      </div>
    </div>,
  );
} else {
  import("./App.jsx").then(({ default: App }) => {
    root.render(
      <StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </StrictMode>,
    );
  });
}
