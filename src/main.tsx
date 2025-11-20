import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { initAudioContextManager } from "./utils/audioContextManager";

// CRITICAL: Initialiser le gestionnaire AudioContext AVANT tout le reste
console.log('🎬 [main] Initialisation gestionnaire audio global...');
initAudioContextManager();
console.log('✅ [main] Gestionnaire audio initialisé');

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
