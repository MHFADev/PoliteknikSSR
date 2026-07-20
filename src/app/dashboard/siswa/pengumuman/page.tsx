"use client";

import { useState, useEffect } from "react";
import { Loader2, Megaphone } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { createClient } from "@/lib/supabase/client";
import { getAnnouncementsForStudent } from "@/actions/broadcast";
import { formatDate } from "@/lib/utils";
import styles from "@/styles/pages/dashboard/siswa/Pengumuman.module.css";

type Announcement = {
  id: string;
  title: string;
  content: string;
  broadcastToAll: boolean;
  createdAt: string;
};

export default function SiswaPengumumanPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase.from("profiles").select("jurusan_id").eq("id", user.id).single().then(({ data: profile }) => {
        getAnnouncementsForStudent(user.id, profile?.jurusan_id ?? null).then((data) => {
          setAnnouncements(data as unknown as Announcement[]);
          setLoading(false);
        });
      });
    });
  }, []);

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <h1>Pengumuman</h1>
        <p>Pengumuman dan informasi dari admin PKL.</p>
      </div>

      {loading ? (
        <div className={styles.loadingSpinner}><Loader2 className="h-6 w-6 animate-spin text-steel" /></div>
      ) : announcements.length === 0 ? (
        <p className={styles.emptyState}>Belum ada pengumuman.</p>
      ) : (
        <div className={styles.announcementList} data-tour="pengumuman-list">
          {announcements.map((ann) => (
            <Card key={ann.id}>
              <div className={styles.announcementInner}>
                <div className={styles.announcementIcon}>
                  <Megaphone className="h-5 w-5" />
                </div>
                <div className={styles.announcementContent}>
                  <div className={styles.announcementTitleRow}>
                    <h3 className={styles.announcementTitle}>{ann.title}</h3>
                    {ann.broadcastToAll && <Badge tone="success">Semua Jurusan</Badge>}
                  </div>
                  <p className={styles.announcementBody}>{ann.content}</p>
                  <p className={styles.announcementDate}>{formatDate(ann.createdAt)}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
