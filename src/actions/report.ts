"use server"

import { createClient } from "@/lib/supabase/server"

export async function sendReport(type: string, message: string) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: "Sesi tidak ditemukan." }

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, role")
      .eq("id", user.id)
      .single()

    const webhookUrl = process.env.DISCORD_REPORT_WEBHOOK
    if (!webhookUrl) return { error: "Webhook tidak dikonfigurasi." }

    const devRoleId = process.env.DISCORD_DEV_ROLE_ID
    const mention = devRoleId ? `<@&${devRoleId}>` : "@here"

    const embed = {
      title: `🐛 Laporan Baru: ${type}`,
      color: 0x6366F1,
      fields: [
        { name: "Dari", value: profile?.full_name || "Tidak dikenal", inline: true },
        { name: "Role", value: profile?.role || "-", inline: true },
        { name: "Email", value: user.email || "-", inline: true },
        { name: "Pesan", value: message },
      ],
      timestamp: new Date().toISOString(),
      footer: { text: "Sistem Laporan PKL" },
    }

    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: `${mention} **Laporan Baru Masuk!**`,
        embeds: [embed],
      }),
    })

    if (!res.ok) {
      const text = await res.text()
      return { error: `Gagal mengirim laporan: ${text}` }
    }

    return { success: true }
  } catch (err: any) {
    return { error: err.message || "Gagal mengirim laporan." }
  }
}