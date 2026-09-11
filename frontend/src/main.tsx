import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { registerSW } from "virtual:pwa-register";

registerSW({
  onNeedRefresh() {
    if (
      confirm(
        "Hay una nueva versión de ssrFacil disponible. ¿Actualizar ahora?",
      )
    ) {
      window.location.reload();
    }
  },
  onOfflineReady() {
    console.log("ssrFacil está lista para funcionar sin conexión.");
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
