#!/usr/bin/env bash
set -euo pipefail
export PATH="${HOME}/.local/bin:${PATH}"
cd "$(dirname "$0")/.."
php artisan db:seed --class=ContentSeeder --force

# Prefer a real symlink so Storage::disk('public') writes are web-visible immediately.
# If a materialized public/storage directory was left behind, merge then re-link.
if [ -e public/storage ] && [ ! -L public/storage ]; then
  echo "Merging materialized public/storage into storage/app/public…"
  rsync -a public/storage/ storage/app/public/
  rm -rf public/storage
fi

if [ ! -L public/storage ]; then
  php artisan storage:link
fi

echo "Storage link: $(readlink -f public/storage 2>/dev/null || echo missing)"
echo "Seeded videos: $(find storage/app/public/episodes -name video_master.mp4 2>/dev/null | wc -l)"
