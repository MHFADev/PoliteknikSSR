"use client";

// ============================================================
// ThemeProvider — Provider tema Terang/Gelap untuk seluruh app
// ============================================================
// Cara kerja:
// 1. Saat mount, baca preferensi dari localStorage (key: "theme").
// 2. Jika tidak ada, default ke "light".
// 3. Terapkan class "dark" ke <html> jika theme === "dark".
// 4. Sediakan context + fungsi toggleTheme untuk komponen anak.
//
// Integrasi dengan SettingsForm:
// - SettingsForm menyimpan theme ke server (via updateSettings).
// - SETIAP KALI toggle, SettingsForm juga panggil applyTheme() agar
//   perubahan terasa INSTAN tanpa perlu refresh.
//
// Cara troubleshooting:
// - Cek localStorage key "theme" di DevTools → Application → Local Storage.
// - Cek <html> class di Elements tab — pastikan "dark" ada saat mode gelap.
// - Jika mode gelap tidak terapkan, pastikan ThemeProvider membungkus layout.
// ============================================================

import { createContext, useContext, useEffect, useState, useCallback } from "react";

type Theme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "light",
  toggleTheme: () => {},
  setTheme: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  // -- Terapkan class "dark" ke <html> + simpan ke localStorage --
  const applyTheme = useCallback((t: Theme) => {
    // Update <html> class
    if (t === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    // Simpan ke localStorage
    localStorage.setItem("theme", t);
    setThemeState(t);
  }, []);

  // -- Baca preferensi dari localStorage saat mount --
  useEffect(() => {
    const saved = localStorage.getItem("theme") as Theme | null;
    const t = saved || "light";
    applyTheme(t);
    setMounted(true);
  }, [applyTheme]);

  // -- Sinkron antar tab (jika user buka 2 tab) --
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "theme") {
        const t = (e.newValue as Theme) || "light";
        applyTheme(t);
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [applyTheme]);

  // -- Sembunyikan konten sampai mount selesai (cegah flash) --
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider
      value={{
        theme,
        toggleTheme: () => applyTheme(theme === "dark" ? "light" : "dark"),
        setTheme: applyTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}
