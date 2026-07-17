"use client";

import { useEffect, useState, useRef } from "react";
import { autoCheckinByGps } from "@/actions/attendance";
import { hasLocationsConfigured } from "@/actions/location";
import { Loader2, MapPin, CheckCircle2, XCircle } from "lucide-react";

type State = "idle" | "checking" | "done" | "error";

export function AutoCheckinBanner() {
  const [state, setState] = useState<State>("idle");
  const [msg, setMsg] = useState("");
  const [status, setStatus] = useState<"hadir" | "telat" | "">("");
  const doneRef = useRef(false);

  useEffect(() => {
    if (doneRef.current) return;
    doneRef.current = true;

    (async () => {
      try {
        const hasLoc = await hasLocationsConfigured();
        if (!hasLoc) return;

        if (typeof window === "undefined" || !navigator.geolocation) return;

        setState("checking");
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            const result = await autoCheckinByGps(pos.coords.latitude, pos.coords.longitude, new Date().toISOString());
            if (result.success) {
              setState("done");
              setStatus((result as any).status);
              setMsg(result.message);
            } else {
              setState("done");
              setMsg(result.message);
              setTimeout(() => setState("idle"), 5000);
            }
          },
          () => { setState("idle"); },
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
        );
      } catch { setState("idle"); }
    })();
  }, []);

  if (state === "checking") {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 1rem", background: "#EFF6FF", color: "#1D4ED8", borderRadius: "0.5rem", fontSize: "0.8125rem", fontWeight: 500, marginBottom: "0.75rem" }}>
        <Loader2 className="h-4 w-4 animate-spin" />
        Auto-checkin: memeriksa lokasi...
      </div>
    );
  }

  if (state === "done" && status) {
    const isHadir = status === "hadir";
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 1rem", background: isHadir ? "#DCFCE7" : "#FEF3C7", color: isHadir ? "#16A34A" : "#D97706", borderRadius: "0.5rem", fontSize: "0.8125rem", fontWeight: 500, marginBottom: "0.75rem" }}>
        {isHadir ? <CheckCircle2 className="h-4 w-4" /> : <MapPin className="h-4 w-4" />}
        {msg}
      </div>
    );
  }

  if (state === "done" && !status) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 1rem", background: "#FEE2E2", color: "#DC2626", borderRadius: "0.5rem", fontSize: "0.8125rem", fontWeight: 500, marginBottom: "0.75rem" }}>
        <XCircle className="h-4 w-4" />
        {msg}
      </div>
    );
  }

  return null;
}
