#!/usr/bin/env bash
# new-branch.sh — auto bikin branch buat kerja tim 2 orang (fitur & tampilan)
# Cara pakai interaktif : ./new-branch.sh
# Cara pakai langsung   : ./new-branch.sh fitur qr-attendance
#                         ./new-branch.sh tampilan navbar-baru [base_branch]

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}=== Auto Branch Creator ===${NC}"

# Pastikan ini folder git repo
if ! git rev-parse --is-inside-work-tree > /dev/null 2>&1; then
  echo -e "${RED}Ini bukan folder git repo bre!${NC}"
  exit 1
fi

# Cek ada perubahan belum di-commit
if [ -n "$(git status --porcelain)" ]; then
  echo -e "${YELLOW}Ada perubahan yang belum di-commit.${NC}"
  read -p "Tetep lanjut bikin branch baru? (y/n): " confirm
  if [ "$confirm" != "y" ]; then
    echo "Oke, commit/stash dulu ya sebelum lanjut."
    exit 0
  fi
fi

# Ambil argumen kalau ada, kalau nggak tanya interaktif
prefix="$1"
branch_name="$2"
base_branch="$3"

if [ -z "$prefix" ]; then
  echo ""
  echo "Pilih tipe branch:"
  echo "1) fitur     (logic/backend/functionality)"
  echo "2) tampilan  (UI/UX/styling)"
  read -p "Pilihan (1/2): " role_choice
  case "$role_choice" in
    1) prefix="fitur" ;;
    2) prefix="tampilan" ;;
    *) echo -e "${RED}Pilihan gak valid.${NC}"; exit 1 ;;
  esac
elif [ "$prefix" != "fitur" ] && [ "$prefix" != "tampilan" ]; then
  echo -e "${RED}Tipe harus 'fitur' atau 'tampilan'.${NC}"
  exit 1
fi

if [ -z "$branch_name" ]; then
  read -p "Nama fitur/tampilan (contoh: qr-attendance, navbar-baru): " branch_name
fi

# Bersihin nama biar valid jadi nama branch
clean_name=$(echo "$branch_name" | tr '[:upper:]' '[:lower:]' | tr ' ' '-' | tr -cd 'a-z0-9-')

if [ -z "$clean_name" ]; then
  echo -e "${RED}Nama branch gak boleh kosong.${NC}"
  exit 1
fi

full_branch_name="${prefix}/${clean_name}"

# Cek branch udah ada apa belum
if git show-ref --verify --quiet "refs/heads/$full_branch_name"; then
  echo -e "${RED}Branch '$full_branch_name' udah ada. Pindah aja pake:${NC}"
  echo "  git checkout $full_branch_name"
  exit 1
fi

# Base branch, default main
if [ -z "$base_branch" ]; then
  read -p "Branch basis (default: main): " base_branch
  base_branch=${base_branch:-main}
fi

echo -e "${BLUE}Update dulu '$base_branch' dari origin...${NC}"
git checkout "$base_branch"
git pull origin "$base_branch"

echo -e "${GREEN}Bikin branch baru: $full_branch_name${NC}"
git checkout -b "$full_branch_name"

read -p "Langsung push ke origin & set upstream? (y/n): " push_confirm
if [ "$push_confirm" = "y" ]; then
  git push -u origin "$full_branch_name"
  echo -e "${GREEN}Berhasil push '$full_branch_name' ke origin!${NC}"
fi

echo ""
echo -e "${GREEN}Selesai! Sekarang lo di branch: $full_branch_name${NC}"
