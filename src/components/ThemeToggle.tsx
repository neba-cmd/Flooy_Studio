"use client";

import React, { useEffect, useState } from "react";
import { ToggleButton, useTheme } from "@once-ui-system/core";

export const ThemeToggle: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Defer the state change to avoid synchronous setState inside the effect
    const t = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(t);
  }, []);

  const currentTheme = theme || "light";
  const nextTheme = currentTheme === "light" ? "dark" : "light";
  const icon = mounted ? (currentTheme === "dark" ? "light" : "dark") : "light";

  return (
    <ToggleButton
      prefixIcon={icon}
      onClick={() => setTheme(nextTheme)}
      aria-label={`Switch to ${nextTheme} mode`}
    />
  );
};
