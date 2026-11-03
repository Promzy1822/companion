"use client";
import { useState } from "react";
import { useIsoLayoutEffect } from "../lib/theme";
import { nextChromeId, registerTabs, unregisterTabs } from "../lib/chrome";

export { BOTTOM_NAV_HEIGHT } from "./BottomNavView";

/**
 * Pages keep using <BottomNav darkMode /> exactly as before. It now just asks the shared
 * tabs / side rail (mounted once in the layout) to be shown on this page.
 */
export default function BottomNav({ darkMode }: { darkMode?: boolean }) {
  const [id] = useState(nextChromeId);

  useIsoLayoutEffect(() => {
    registerTabs(id, { darkMode });
  }, [id, darkMode]);

  useIsoLayoutEffect(() => () => unregisterTabs(id), [id]);

  return null;
}
