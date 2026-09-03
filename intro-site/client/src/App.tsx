import { useEffect, useState } from "react";
import Home from "@/pages/Home";

export const APP_BASE_URL = (import.meta.env.VITE_APP_BASE_URL ?? "").replace(/\/$/, "");

export function appHref(path: string) {
  return `${APP_BASE_URL}${path}` || path;
}

export default function App() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return <Home scrolled={scrolled} />;
}
