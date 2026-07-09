"use client";

import { useState, useEffect } from "react";
import { Loader2, Megaphone } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { createClient } from "@/lib/supabase/client";
import { getAnnouncementsForStudent } from "@/actions/broadcast";
import { formatDate } from "@/lib/utils";

type Announcement = {
  id: string;
  title: string;
  content: string;
  broadcast_to_all: boolean;
  created_at: string;
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
          setAnnouncements(data as Announcement[]);
          setLoading(false);
        });
      });
    });
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-deep">Pengumuman</h1>
        <p className="text-sm text-mist-dim">Pengumuman dan informasi dari admin PKL.</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-steel" /></div>
      ) : announcements.length === 0 ? (
        <p className="py-12 text-center text-sm text-mist-dim">Belum ada pengumuman.</p>
      ) : (
        <div className="space-y-3">
          {announcements.map((ann) => (
            <Card key={ann.id}>
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-vibrant/10 text-blue-vibrant">
                  <Megaphone className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-display font-semibold text-deep">{ann.title}</h3>
                    {ann.broadcast_to_all && <Badge tone="success">Semua Jurusan</Badge>}
                  </div>
                  <p className="mt-1 text-sm text-steel whitespace-pre-wrap">{ann.content}</p>
                  <p className="mt-2 text-xs text-mist-dim">{formatDate(ann.created_at)}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
