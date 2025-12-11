"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function Logo({ className }: { className?: string }) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <img src="/icon.svg" alt="Logo" className={className} />;
  }

  return (
    <img
      src={resolvedTheme === "dark" ? "/icon_dark.svg" : "/icon.svg"}
      alt="Logo"
      className={className}
    />
  );
}
