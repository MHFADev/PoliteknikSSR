"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export function RouteProgressBar() {
  const pathname = usePathname();
  const prevPathname = useRef(pathname);
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (prevPathname.current !== pathname) {
      prevPathname.current = pathname;
      setVisible(true);
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setVisible(false), 400);
    }
  }, [pathname]);

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[9999] h-1 transition-opacity duration-200"
      style={{ opacity: visible ? 1 : 0 }}
    >
      <div className="h-full w-full overflow-hidden">
        <div
          className="h-full w-1/3 rounded-full bg-gradient-to-r from-sky via-sky-deep to-sky animate-loading-bar"
        />
      </div>
    </div>
  );
}
