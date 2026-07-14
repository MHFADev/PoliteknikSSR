"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { Ban, X } from "lucide-react";

export function BlockedWatcher() {
  const router = useRouter();
  const [showPopup, setShowPopup] = useState(false);
  const blockedRef = useRef(false);

  const handleBlocked = useCallback(() => {
    if (blockedRef.current) return;
    blockedRef.current = true;
    setShowPopup(true);
  }, []);

  useEffect(() => {
    const supabase = createClient();
    let intervalId: ReturnType<typeof setInterval>;

    async function checkApproved() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("approved")
        .eq("id", user.id)
        .single();

      if (profile && profile.approved === false) {
        handleBlocked();
      }
    }

    checkApproved();
    intervalId = setInterval(checkApproved, 15000);

    return () => clearInterval(intervalId);
  }, [handleBlocked]);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setShowPopup(false);
    router.replace("/login?blocked=true");
    router.refresh();
  }

  return (
    <AnimatePresence>
      {showPopup && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mb-4">
              <Ban className="w-7 h-7 text-red-500" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">
              Akun Anda Telah Diblokir
            </h2>
            <p className="text-sm text-gray-500 mb-6 leading-relaxed">
              Akun Anda telah diblokir oleh admin. Anda akan dialihkan ke halaman login.
            </p>
            <button
              onClick={handleLogout}
              className="w-full py-2.5 px-4 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 transition-colors"
            >
              <X className="w-4 h-4 inline-block mr-1.5 align-middle" />
              Keluar
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
