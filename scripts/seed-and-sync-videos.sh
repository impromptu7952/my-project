#!/usr/bin/env bash
set -euo pipefail
export PATH="${HOME}/.local/bin:${PATH}"
cd "$(dirname "$0")/.."
php artisan db:seed --class=ContentSeeder --force
# php artisan serve cannot reliably follow public/storage symlink; materialize files
if [ -L public/storage ]; then
  rm public/storage
fi
mkdir -p public/storage
rsync -a storage/app/public/ public/storage/
echo "Seeded and synced public/storage ($(find public/storage/episodes -name video_master.mp4 | wc -l) videos)"
