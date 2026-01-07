import { Button } from "./ui/button";
import { Tooltip } from "./ui/tooltip";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    const isDark = saved ? saved === "dark" : false;
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  }

  return (
    <Tooltip content={dark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"} side="bottom">
      <Button variant="secondary" size="sm" onClick={toggle}>
        {dark ? "Modo claro" : "Modo oscuro"}
      </Button>
    </Tooltip>
  );
}
