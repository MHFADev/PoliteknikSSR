# ================================================================
#  Auto Git Pull - Aman & Otomatis
#  Konfigurasi sudah diisi, tinggal taruh 3 file ini satu folder
#  lalu jalankan setup-scheduled-task.bat
# ================================================================

# ---------- KONFIGURASI ----------
$RepoPath       = "C:\Users\USER\Downloads\politeknik-ssr"
$Branch         = "main"
$RunNpmInstall  = $true
$RestartCommand = ""
# ---------------------------------

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$LogFile  = Join-Path $RepoPath "auto-pull.log"
$LockFile = Join-Path $RepoPath ".auto-pull.lock"

function Write-Log {
    param([string]$Message)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $line = "[$timestamp] $Message"
    Write-Host $line
    Add-Content -Path $LogFile -Value $line -Encoding UTF8
}

# --- Validasi awal ---
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: Git belum terinstall. Download di https://git-scm.com/download/win"
    exit 1
}

if (-not (Test-Path $RepoPath)) {
    Write-Host "ERROR: Folder repo tidak ditemukan: $RepoPath"
    exit 1
}

Set-Location $RepoPath

if (-not (Test-Path ".git")) {
    Write-Host "ERROR: $RepoPath bukan git repository (folder .git tidak ketemu)."
    exit 1
}

# --- Cegah dua proses jalan bersamaan ---
if (Test-Path $LockFile) {
    $lockAge = (Get-Date) - (Get-Item $LockFile).LastWriteTime
    if ($lockAge.TotalMinutes -lt 10) {
        Write-Log "Proses lain masih jalan (lock file ada). Skip run ini."
        exit 0
    } else {
        Write-Log "Lock file basi (>10 menit) ditemukan, dihapus."
        Remove-Item $LockFile -Force
    }
}
New-Item -Path $LockFile -ItemType File -Force | Out-Null

try {
    Write-Log "=== Auto-pull dimulai ==="

    # --- Cek perubahan lokal yang belum di-commit ---
    $status = git status --porcelain
    if ($status) {
        Write-Log "DIBATALKAN: Ada perubahan lokal yang belum di-commit:"
        Write-Log ($status | Out-String).Trim()
        Write-Log "Commit atau stash dulu sebelum auto-pull bisa jalan."
        return
    }

    # --- Fetch & bandingkan commit lokal vs remote ---
    git fetch origin $Branch 2>&1 | Out-String | ForEach-Object { if ($_.Trim()) { Write-Log $_.Trim() } }

    $localCommit  = git rev-parse HEAD
    $remoteCommit = git rev-parse "origin/$Branch"

    if ($localCommit -eq $remoteCommit) {
        Write-Log "Sudah paling baru, tidak ada perubahan."
        return
    }

    Write-Log "Update ditemukan ($($localCommit.Substring(0,7)) -> $($remoteCommit.Substring(0,7))), melakukan pull..."
    $pullOutput = git pull origin $Branch 2>&1 | Out-String
    Write-Log $pullOutput.Trim()

    if ($LASTEXITCODE -ne 0) {
        Write-Log "ERROR: git pull gagal, cek konflik atau koneksi internet."
        return
    }

    Write-Log "Pull berhasil."

    # --- Auto npm install kalau dependency berubah ---
    $changedFiles = git diff --name-only $localCommit $remoteCommit
    if ($RunNpmInstall -and ($changedFiles -match "package(-lock)?\.json")) {
        Write-Log "package.json berubah, menjalankan npm install..."
        npm install 2>&1 | Out-String | ForEach-Object { if ($_.Trim()) { Write-Log $_.Trim() } }
    }

    Write-Log "=== Auto-pull selesai ==="
}
finally {
    Remove-Item $LockFile -Force -ErrorAction SilentlyContinue
}
