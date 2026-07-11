# new-branch.ps1 — auto bikin branch buat kerja tim 2 orang (fitur & tampilan)
# Cara pakai interaktif : ./new-branch.ps1
# Cara pakai langsung   : ./new-branch.ps1 fitur register
#                         ./new-branch.ps1 tampilan navbar-baru develop

param(
    [Parameter(Position = 0)]
    [string]$Prefix,

    [Parameter(Position = 1)]
    [string]$BranchName,

    [Parameter(Position = 2)]
    [string]$BaseBranch
)

function Write-Info    { param($msg) Write-Host $msg -ForegroundColor Cyan }
function Write-Success { param($msg) Write-Host $msg -ForegroundColor Green }
function Write-Warn    { param($msg) Write-Host $msg -ForegroundColor Yellow }
function Write-Err     { param($msg) Write-Host $msg -ForegroundColor Red }

Write-Info "=== Auto Branch Creator ==="

# Pastikan ini folder git repo
git rev-parse --is-inside-work-tree *> $null
if ($LASTEXITCODE -ne 0) {
    Write-Err "Ini bukan folder git repo bre!"
    exit 1
}

# Cek ada perubahan belum di-commit
$status = git status --porcelain
if ($status) {
    Write-Warn "Ada perubahan yang belum di-commit."
    $confirm = Read-Host "Tetep lanjut bikin branch baru? (y/n)"
    if ($confirm -ne "y") {
        Write-Host "Oke, commit/stash dulu ya sebelum lanjut."
        exit 0
    }
}

# Tipe branch
if (-not $Prefix) {
    Write-Host ""
    Write-Host "Pilih tipe branch:"
    Write-Host "1) fitur     (logic/backend/functionality)"
    Write-Host "2) tampilan  (UI/UX/styling)"
    $roleChoice = Read-Host "Pilihan (1/2)"
    switch ($roleChoice) {
        "1" { $Prefix = "fitur" }
        "2" { $Prefix = "tampilan" }
        default { Write-Err "Pilihan gak valid."; exit 1 }
    }
} elseif ($Prefix -ne "fitur" -and $Prefix -ne "tampilan") {
    Write-Err "Tipe harus 'fitur' atau 'tampilan'."
    exit 1
}

# Nama branch
if (-not $BranchName) {
    $BranchName = Read-Host "Nama fitur/tampilan (contoh: qr-attendance, navbar-baru)"
}

# Bersihin nama biar valid jadi nama branch
$cleanName = $BranchName.ToLower() -replace ' ', '-' -replace '[^a-z0-9\-]', ''

if (-not $cleanName) {
    Write-Err "Nama branch gak boleh kosong."
    exit 1
}

$fullBranchName = "$Prefix/$cleanName"

# Cek branch udah ada apa belum
git show-ref --verify --quiet "refs/heads/$fullBranchName"
if ($LASTEXITCODE -eq 0) {
    Write-Err "Branch '$fullBranchName' udah ada. Pindah aja pake:"
    Write-Host "  git checkout $fullBranchName"
    exit 1
}

# Base branch, default main
if (-not $BaseBranch) {
    $BaseBranch = Read-Host "Branch basis (default: main)"
    if (-not $BaseBranch) { $BaseBranch = "main" }
}

Write-Info "Update dulu '$BaseBranch' dari origin..."
git checkout $BaseBranch
git pull origin $BaseBranch

Write-Success "Bikin branch baru: $fullBranchName"
git checkout -b $fullBranchName

$pushConfirm = Read-Host "Langsung push ke origin & set upstream? (y/n)"
if ($pushConfirm -eq "y") {
    git push -u origin $fullBranchName
    Write-Success "Berhasil push '$fullBranchName' ke origin!"
}

Write-Host ""
Write-Success "Selesai! Sekarang lo di branch: $fullBranchName"
