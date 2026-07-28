"use server"

import { createClient } from "@/lib/supabase/server"

function generateInitialAvatar(name: string): string {
  const initial = (name || "?").charAt(0).toUpperCase()
  const colors = ["#6366F1", "#3B82F6", "#8B5CF6", "#EC4899", "#F59E0B", "#10B981"]
  const bg = colors[name.length % colors.length]
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"><rect width="80" height="80" rx="40" fill="${bg}"/><text x="40" y="46" text-anchor="middle" fill="#fff" font-size="32" font-weight="700" font-family="sans-serif">${initial}</text></svg>`
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`
}

export async function sendReport(type: string, message: string) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: "Sesi tidak ditemukan." }

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, role, avatar_url")
      .eq("id", user.id)
      .single()

    const webhookUrl = process.env.DISCORD_REPORT_WEBHOOK
    if (!webhookUrl) return { error: "Webhook tidak dikonfigurasi." }

    const devRoleId = process.env.DISCORD_DEV_ROLE_ID
    const mention = devRoleId ? `<@&${devRoleId}>` : "@here"

    const avatarUrl = profile?.avatar_url || generateInitialAvatar(profile?.full_name || "")

    const embed = {
      title: `🚨 Laporan Baru Masuk!`,
      color: 0x6366F1,
      author: { name: profile?.full_name || "Tidak dikenal", icon_url: avatarUrl },
      thumbnail: { url: avatarUrl },
      fields: [
        { name: "Informasi Pelapor", value: `\`\`\`👤 Nama: ${profile?.full_name || "Tidak dikenal"}\n🎓 Role: ${profile?.role || "-"}\n📧 Email: ${user.email || "-"}\`\`\``, inline: false },
        { name: "📝 Pesan / Deskripsi", value: message },
      ],
      timestamp: new Date().toISOString(),
      footer: { text: "Sistem Laporan PKL" },
    }

    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: `${mention} Laporan Baru Masuk!`,
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