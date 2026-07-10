"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, UploadCloud, X } from "lucide-react";
import imageCompression from "browser-image-compression";
import { saveLogbookEntry } from "@/actions/logbook";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { todayISODate, formatDate } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

export function LogbookForm({ existingContent, existingPhotoUrl }: { existingContent?: string; existingPhotoUrl?: string }) {
  const [content, setContent] = useState(existingContent ?? "");
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(existingPhotoUrl ?? null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const today = todayISODate();
  const supabase = createClient();

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setIsCompressing(true);
        
        // Compress image
        const options = {
          maxSizeMB: 0.5,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
          fileType: "image/jpeg",
        };
        
        const compressedFile = await imageCompression(file, options);
        
        setPhoto(compressedFile);
        
        // Preview
        const reader = new FileReader();
        reader.onload = () => setPhotoPreview(reader.result as string);
        reader.readAsDataURL(compressedFile);
        
      } catch (err) {
        console.error("Compression error:", err);
        setError("Gagal memproses foto, coba lagi");
      } finally {
        setIsCompressing(false);
      }
    }
  }

  function removePhoto() {
    setPhoto(null);
    setPhotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    setSaved(false);

    try {
      let photoUrl = existingPhotoUrl ?? null;

      if (photo) {
        // Upload to Supabase Storage
        const fileExt = "jpeg"; // We converted to jpeg
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `logbook_photos/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("attachments")
          .upload(filePath, photo, { upsert: true, contentType: "image/jpeg" });

        if (uploadError) throw new Error("Gagal mengupload foto: " + uploadError.message);

        // Get public URL
        const { data } = supabase.storage.from("attachments").getPublicUrl(filePath);
        photoUrl = data.publicUrl;
      }

      const result = await saveLogbookEntry({ entry_date: today, content, photoUrl });

      if (result.error) {
        setError(result.error);
      } else {
        setSaved(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader title="Kegiatan Hari Ini" subtitle={formatDate(today)} />
      <form onSubmit={handleSubmit} className="space-y-4">
        <textarea
          required
          minLength={20}
          rows={6}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Ceritakan aktivitas PKL kamu hari ini: apa yang dikerjakan, kendala yang dihadapi, dan hal baru yang dipelajari..."
          className="w-full rounded-skylearn-lg border border-outline bg-surface px-4 py-3 text-ink text-sm leading-relaxed outline-none focus:border-sky focus:ring-2 focus:ring-sky-soft"
        />
        
        {/* Photo Upload Section */}
        <div className="space-y-3">
          <p className="text-sm font-medium text-ink-muted">Foto Bukti Kegiatan (opsional)</p>
          {photoPreview ? (
            <div className="relative rounded-skylearn-xl overflow-hidden border border-outline">
              <img src={photoPreview} alt="Preview foto bukti" className="w-full h-48 object-cover" />
              <button
                type="button"
                onClick={removePhoto}
                className="absolute top-2 right-2 bg-white/90 p-1.5 rounded-full shadow-sm hover:bg-white"
              >
                <X className="h-4 w-4 text-ink-muted" />
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-outline rounded-skylearn-xl p-6 cursor-pointer hover:border-sky-soft hover:bg-sky-soft/20 transition-colors">
              <UploadCloud className="h-8 w-8 text-ink-muted" />
              <div className="text-center">
                <p className="text-sm font-medium text-ink">Klik untuk upload foto</p>
                <p className="text-xs text-ink-subtle">Foto akan dikompres otomatis (max 500KB)</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoChange}
                disabled={isCompressing}
              />
              {isCompressing && <p className="text-sm text-ink-subtle">Mengompres foto...</p>}
            </label>
          )}
        </div>

        {error && <p className="text-sm text-coral">{error}</p>}
        {saved && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 rounded-skylearn-lg bg-leaf-soft px-4 py-2.5 text-sm text-leaf-deep"
          >
            <CheckCircle2 className="h-4 w-4" /> Kegiatan tersimpan.
          </motion.div>
        )}
        <Button type="submit" isLoading={isSubmitting || isCompressing} className="w-full bg-sky hover:bg-sky-deep text-white h-14 rounded-skylearn-lg text-lg">
          Simpan Kegiatan
        </Button>
      </form>
    </Card>
  );
}
