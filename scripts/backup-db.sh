#!/bin/bash
# AegeanSea Hotel Manager — SQLite daily backup
# Install via cron on CT101 host:
#   chmod +x /opt/hotel-manager/scripts/backup-db.sh
#   crontab -e -> 0 2 * * * /opt/hotel-manager/scripts/backup-db.sh >> /var/log/hotel-backup.log 2>&1

set -euo pipefail

DB_PATH="/opt/hotel-manager/data/hotel.db"
BACKUP_DIR="/opt/hotel-manager/backups"
TIMESTAMP=$(date +%Y-%m-%d_%H%M%S)

mkdir -p "$BACKUP_DIR"

# Atomic backup using sqlite3 .backup (handles WAL mode correctly)
sqlite3 "$DB_PATH" ".backup '$BACKUP_DIR/hotel-$TIMESTAMP.db'"

# Remove backups older than 7 days
find "$BACKUP_DIR" -name "hotel-*.db" -type f -mtime +7 -delete

echo "[$(date)] Backup complete: hotel-$TIMESTAMP.db"
