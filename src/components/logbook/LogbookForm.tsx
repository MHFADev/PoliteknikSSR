"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { saveLogbookEntry } from "@/actions/logbook";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { todayISODate, formatDate } from "@/lib/utils";

export function LogbookForm({ existingContent }: { existingContent?: string }) {
  const [content, setContent] = useState(existingContent ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const today = todayISODate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    setSaved(false);

    const result = await saveLogbookEntry({ entry_date: today, content });

    setIsSubmitting(false);
    if (result.error) {
      setError(result.error);
    } else {
      setSaved(true);
    }
  }

  return (
    <Card>
      <CardHeader title="Logbook Hari Ini" subtitle={formatDate(today)} />
      <form onSubmit={handleSubmit} className="space-y-4">
        <textarea
          required
          minLength={20}
          rows={8}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Ceritakan aktivitas PKL kamu hari ini: apa yang dikerjakan, kendala yang dihadapi, dan hal baru yang dipelajari..."
          className="w-full rounded-xl border border-deep/10 bg-white/70 px-4 py-3 text-sm leading-relaxed outline-none focus:border-ocean"
        />
        {error && <p className="text-sm text-danger">{error}</p>}
        {saved && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 rounded-xl bg-blue-vibrant/10 px-3 py-2 text-sm text-blue-vibrant"
          >
            <CheckCircle2 className="h-4 w-4" /> Logbook tersimpan.
          </motion.div>
        )}
        <Button type="submit" isLoading={isSubmitting}>
          Simpan Logbook
        </Button>
      </form>
    </Card>
  );
}
