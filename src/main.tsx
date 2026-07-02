import ReactDOM from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { getRouter } from "./router";
import "./lib/pwa";
import "./styles.css";

const router = getRouter();

ReactDOM.createRoot(document.getElementById("app")!).render(<RouterProvider router={router} />);

if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    void navigator.serviceWorker.register("/sw.js");
  });
}
