# AegeanSea Hotel Manager — Deployment Guide

## Architecture

```
[Browser] --HTTPS--> [Cloudflare Tunnel] --HTTP--> [Next.js :3000]
                                                        |
                                                        +--> [SQLite ./data/hotel.db]
                                                        |
                                                        +-WebSocket--> [Home Assistant :8123]
```

- **Next.js** runs as a standalone Node.js process managed by PM2.
- **Cloudflare Tunnel** provides HTTPS and remote access.
- **SQLite** database lives at `/opt/hotel-manager/data/hotel.db`.
- **LAN access** via `http://10.10.90.11:3000` (no HTTPS needed on LAN).

---

## 1. Server Setup (fresh CT101)

CT101 is an LXC container on Proxmox at `10.10.90.11`.

```bash
ssh root@10.10.90.11

# Update system
apt update && apt upgrade -y

# Install essentials
apt install -y curl git sqlite3

# Install Node.js 22 (LTS)
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install -y nodejs

# Enable corepack (for pnpm)
corepack enable

# Install PM2 globally
npm install -g pm2

# Verify
node -v    # v22.x.x
pnpm -v    # 10.x.x
pm2 -v     # 6.x.x
```

---

## 2. Deploy the App

### Option A: Git clone (if you have a remote repo)

```bash
cd /opt
git clone <repo-url> hotel-manager
cd hotel-manager
```

### Option B: Copy from dev machine (no repo)

From your Windows machine:
```bash
# Using scp (run from Windows terminal / Git Bash)
scp -r D:/Ha-Project/AegeanSea/hotel-manager root@10.10.90.11:/opt/hotel-manager
```

Or using rsync (better for updates):
```bash
rsync -avz --exclude node_modules --exclude .next --exclude .env.local --exclude data \
  hotel-manager/ root@10.10.90.11:/opt/hotel-manager/
```

### Install and build

```bash
cd /opt/hotel-manager

# Install dependencies (builds native modules like better-sqlite3)
pnpm install

# Create .env
cp .env.example .env
nano .env
# Fill in: HA_URL, HA_TOKEN, AUTH_SECRET
# Generate AUTH_SECRET with: node -e "console.log(require('crypto').randomBytes(33).toString('base64'))"

# Create data directory
mkdir -p data

# Build for production
pnpm build

# Start with PM2
pm2 start ecosystem.config.js

# Verify
curl http://localhost:3000/api/health
# Should return: {"ok":true}

# Save PM2 process list (survives reboot)
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Run the command it outputs (copy-paste the exact line)
```

---

## 3. Environment Variables

All variables are in `.env.example`. Copy to `.env` and fill in.

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `HA_URL` | Yes | Home Assistant URL (reachable from CT101) | `http://10.10.90.10:8123` |
| `HA_TOKEN` | Yes | HA long-lived access token | `eyJhbGciOi...` |
| `AUTH_SECRET` | Yes | Auth.js session encryption key (random 33+ bytes) | `node -e "..."` |
| `AUTH_TRUST_HOST` | Yes | Allow sessions across origins | `true` |
| `PROPERTY_NAME` | Yes | Hotel name (server-side) | `AegeanSea Hotel` |
| `NEXT_PUBLIC_PROPERTY_NAME` | Yes | Hotel name (client-side, baked at build) | `AegeanSea Hotel` |
| `DB_PATH` | Yes | SQLite file path | `/opt/hotel-manager/data/hotel.db` |
| `NODE_ENV` | Yes | Node environment | `production` |
| `PORT` | Yes | App listen port | `3000` |

**Where to get `HA_TOKEN`:**
1. Open Home Assistant UI
2. Click your profile (bottom-left)
3. Scroll to "Long-lived Access Tokens"
4. Click "Create Token", name it (e.g., "hotel-manager")
5. Copy the token immediately (shown only once)

**How to generate `AUTH_SECRET`:**
```bash
node -e "console.log(require('crypto').randomBytes(33).toString('base64'))"
```

---

## 4. Cloudflare Tunnel (HTTPS + Remote Access)

Cloudflare Tunnel runs on CT101 as a systemd service. It gives you:
- Real HTTPS certificate (no browser warnings)
- Remote access from anywhere
- No port forwarding needed

### Install cloudflared

```bash
# Add Cloudflare repo
curl -fsSL https://pkg.cloudflare.com/cloudflare-main.gpg | tee /usr/share/keyrings/cloudflare-main.gpg > /dev/null
echo "deb [signed-by=/usr/share/keyrings/cloudflare-main.gpg] https://pkg.cloudflare.com/cloudflared $(lsb_release -cs) main" | tee /etc/apt/sources.list.d/cloudflared.list
apt update
apt install -y cloudflared
```

### Authenticate and create tunnel

```bash
# Login (opens browser — if headless, use the URL it prints)
cloudflared tunnel login

# Create a tunnel
cloudflared tunnel create hotel-manager

# Note the tunnel ID from the output (e.g., abc123-def456-...)
```

### Configure the tunnel

```bash
mkdir -p /etc/cloudflared

cat > /etc/cloudflared/config.yml << 'EOF'
tunnel: <tunnel-id>
credentials-file: /root/.cloudflared/<tunnel-id>.json

ingress:
  - hostname: hotel.yourdomain.com
    service: http://localhost:3000
  - service: http_status:404
EOF
```

Replace `<tunnel-id>` with your actual tunnel ID and `hotel.yourdomain.com` with your domain.

### Add DNS record

```bash
cloudflared tunnel route dns hotel-manager hotel.yourdomain.com
```

### Start as a service

```bash
cloudflared service install
systemctl enable cloudflared
systemctl start cloudflared

# Verify
systemctl status cloudflared
cloudflared tunnel list
```

Now `https://hotel.yourdomain.com` reaches your app.

---

## 5. Deploying Updates

### From git

```bash
cd /opt/hotel-manager
git pull
pnpm install          # only needed if dependencies changed
pnpm build
pm2 restart hotel-manager
```

### From rsync (no git)

From your Windows machine:
```bash
rsync -avz --exclude node_modules --exclude .next --exclude .env --exclude .env.local --exclude data \
  hotel-manager/ root@10.10.90.11:/opt/hotel-manager/
```

Then on CT101:
```bash
cd /opt/hotel-manager
pnpm install
pnpm build
pm2 restart hotel-manager
```

Downtime is only during the `pm2 restart` (< 2 seconds). Build runs while the old version is still serving.

---

## 6. Backup & Restore

### Automatic daily backup (cron)

```bash
chmod +x /opt/hotel-manager/scripts/backup-db.sh

# Add cron job (runs daily at 2:00 AM)
crontab -e
# Add this line:
0 2 * * * /opt/hotel-manager/scripts/backup-db.sh >> /var/log/hotel-backup.log 2>&1
```

The script uses `sqlite3 .backup` (atomic, WAL-safe) and keeps 7 days of backups in `/opt/hotel-manager/backups/`.

### Manual backup

```bash
sqlite3 /opt/hotel-manager/data/hotel.db ".backup /opt/hotel-manager/backups/manual-$(date +%Y%m%d).db"
```

### Restore from backup

```bash
pm2 stop hotel-manager
cp /opt/hotel-manager/backups/<backup-file>.db /opt/hotel-manager/data/hotel.db
pm2 start hotel-manager
curl http://localhost:3000/api/health
```

---

## 7. Troubleshooting

### App won't start

```bash
pm2 logs hotel-manager --lines 50
```

**Common causes:**
- Missing env vars: check `.env` has all required values
- SQLite permission error: `chown -R root:root /opt/hotel-manager/data/`
- Port in use: `lsof -i :3000`
- Build outdated: re-run `pnpm build`

### "Disconnected from Home Assistant"

```bash
# Test HA connectivity from CT101
curl http://10.10.90.10:8123/api/ -H "Authorization: Bearer $HA_TOKEN"
```

- Verify `HA_URL` is reachable from CT101
- Verify `HA_TOKEN` is valid (not expired/revoked)

### Database locked

```bash
# Check if multiple processes access the DB
fuser /opt/hotel-manager/data/hotel.db

# Restart the app
pm2 restart hotel-manager
```

### PM2 commands

```bash
pm2 status                      # Show all processes
pm2 logs hotel-manager          # Tail logs
pm2 restart hotel-manager       # Restart
pm2 stop hotel-manager          # Stop
pm2 monit                       # Real-time monitoring
```

### Cloudflare Tunnel not working

```bash
systemctl status cloudflared
journalctl -u cloudflared -f    # Follow logs
cloudflared tunnel list         # Check tunnel exists
```

---

## 8. New Client Replication

### Changes per client

| Item | What to change |
|------|---------------|
| `.env` | `HA_URL`, `HA_TOKEN`, `AUTH_SECRET`, `PROPERTY_NAME`, `NEXT_PUBLIC_PROPERTY_NAME` |
| Cloudflared config | Tunnel ID, hostname |

### Stays the same

- All application code
- `ecosystem.config.js`
- `scripts/backup-db.sh`
- Server setup steps

### Steps

```bash
# On the new server: follow sections 1-4 of this guide
# Only .env values and cloudflared config change per client
```

---

## Quick Reference

```bash
# Start
pm2 start ecosystem.config.js

# Stop
pm2 stop hotel-manager

# Restart (after code changes + build)
pm2 restart hotel-manager

# Logs
pm2 logs hotel-manager

# Health check
curl http://localhost:3000/api/health

# Update code + rebuild
git pull && pnpm install && pnpm build && pm2 restart hotel-manager
```
