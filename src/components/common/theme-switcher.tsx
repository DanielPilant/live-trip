"use client";

import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

const ThemeSwitcher = () => {
  const [mounted, setMounted] = useState(false);
  const { setTheme, resolvedTheme } = useTheme();

  // useEffect only runs on the client, so now we can safely show the UI
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const ICON_SIZE = 16;

  const toggleTheme = () => {
    setTheme(resolvedTheme === "light" ? "dark" : "light");
  };

  return (
    <Button variant="ghost" size={"sm"} onClick={toggleTheme} className="rounded-full">
      {resolvedTheme === "light" ? (
        <Sun
          key="light"
          size={ICON_SIZE}
          className={"text-muted-foreground"}
        />
      ) : (
        <Moon
          key="dark"
          size={ICON_SIZE}
          className={"text-muted-foreground"}
        />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
};

export { ThemeSwitcher };
