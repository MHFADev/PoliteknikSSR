"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { CheckCircle2, UploadCloud, X } from "lucide-react";
import imageCompression from "browser-image-compression";
import { saveLogbookEntry } from "@/actions/logbook";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { todayISODate, formatDate } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import styles from "@/styles/components/logbook/LogbookForm.module.css";

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
          className={styles.textArea}
        />
        
        {/* Photo Upload Section */}
        <div className={styles.photoSection}>
          <p className="text-sm font-medium text-ink-muted">Foto Bukti Kegiatan (opsional)</p>
          {photoPreview ? (
            <div className={styles.photoPreview}>
              {/* Ganti <img> ke <Image> dari next/image agar kompatibel dengan SSR */}
              <Image src={photoPreview} alt="Preview foto bukti" fill unoptimized={true} className={styles.photoPreviewImg} />
              <button
                type="button"
                onClick={removePhoto}
                className={styles.photoRemoveBtn}
              >
                <X className="h-4 w-4 text-ink-muted" />
              </button>
            </div>
          ) : (
            <label className={styles.uploadPlaceholder}>
              <UploadCloud className={styles.uploadIcon} />
              <div className="text-center">
                <p className={styles.uploadText}>Klik untuk upload foto</p>
                <p className={styles.uploadSubtext}>Foto akan dikompres otomatis (max 500KB)</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoChange}
                disabled={isCompressing}
              />
              {isCompressing && <p className={styles.uploadSubtext}>Mengompres foto...</p>}
            </label>
          )}
        </div>

        {error && <p className="text-sm text-coral">{error}</p>}
        {saved && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className={styles.successMsg}
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
