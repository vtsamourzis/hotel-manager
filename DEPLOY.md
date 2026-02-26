# AegeanSea Hotel Manager — Deployment Guide

## Architecture

```
[Browser] --HTTPS--> [Caddy :443] --HTTP--> [Next.js :3000]
                                                 |
                                                 +--> [SQLite ./data/hotel.db]
                                                 |
                                                 +-WebSocket--> [Home Assistant :8123]

[Cloudflare Tunnel] --HTTP--> [Next.js :3000]  (bypasses Caddy)
```

- **Caddy** terminates HTTPS on the LAN (self-signed internal CA).
- **Cloudflare Tunnel** provides remote access with real TLS (bypasses Caddy).
- **SQLite** database lives on the host at `./data/hotel.db`, bind-mounted into the container.
- **Next.js standalone** runs as a single `node server.js` process inside Alpine Linux.

---

## 1. Prerequisites

| Requirement | Notes |
|-------------|-------|
| CT101 (10.10.90.11) | Debian/Ubuntu LXC container |
| Docker Engine + Docker Compose | `apt install docker.io docker-compose-plugin` |
| Git | `apt install git` |
| sqlite3 CLI | `apt install sqlite3` (for backup script) |
| Home Assistant | Accessible from CT101 at `HA_URL` |
| HA long-lived token | Settings -> People -> Security -> Long-lived Access Tokens |
| cloudflared (optional) | System service for remote access (separate from this app) |

---

## 2. First-Time Setup

```bash
# 1. SSH into CT101
ssh root@10.10.90.11

# 2. Clone the repository
cd /opt
git clone <repo-url> hotel-manager
cd hotel-manager

# 3. Create the .env file
cp .env.example .env
nano .env
# Fill in:
#   HA_URL      — your Home Assistant URL (e.g., http://10.10.90.10:8123)
#   HA_TOKEN    — long-lived access token from HA
#   AUTH_SECRET — generate with: openssl rand -base64 33

# 4. Create data directory with correct permissions
# UID 1001 matches the "nextjs" user inside the container
mkdir -p data
chown -R 1001:1001 data

# 5. Build and start
docker compose up -d --build
# First build takes 3-5 minutes (installs deps, compiles native modules)

# 6. Verify
docker compose ps              # Both services should be "Up (healthy)"
docker logs hotel-manager      # Check for startup errors
curl -k https://10.10.90.11/api/health   # Should return {"ok":true}

# 7. First login
# Open https://10.10.90.11 in browser
# Accept the self-signed certificate warning
# The setup wizard appears — create the admin account
```

---

## 3. Environment Variables

All variables are documented in `.env.example`. Copy it to `.env` and fill in values.

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `HA_URL` | Yes | Home Assistant base URL (reachable from CT101) | `http://10.10.90.10:8123` |
| `HA_TOKEN` | Yes | HA long-lived access token | `eyJhbGciOi...` |
| `AUTH_SECRET` | Yes | Auth.js session encryption key | `openssl rand -base64 33` |
| `AUTH_TRUST_HOST` | Yes | Allow sessions across origins (LAN + tunnel) | `true` |
| `PROPERTY_NAME` | Yes | Hotel name (server-side rendering) | `AegeanSea Hotel` |
| `NEXT_PUBLIC_PROPERTY_NAME` | Yes | Hotel name (client-side, baked at build) | `AegeanSea Hotel` |
| `DB_PATH` | Yes | SQLite path inside container | `/app/data/hotel.db` |
| `NODE_ENV` | Yes | Node environment | `production` |
| `PORT` | Yes | App listen port (internal) | `3000` |
| `HOSTNAME` | Yes | Listen address (must be 0.0.0.0 in Docker) | `0.0.0.0` |

**Where to get `HA_TOKEN`:**
1. Open Home Assistant UI
2. Go to your profile (bottom-left)
3. Scroll to "Long-lived Access Tokens"
4. Click "Create Token", give it a name (e.g., "hotel-manager")
5. Copy the token immediately (it won't be shown again)

---

## 4. Deploying Updates

```bash
cd /opt/hotel-manager

# Pull latest code
git pull

# Rebuild and restart (downtime: ~60-90 seconds)
docker compose up -d --build

# Verify
docker compose ps
docker logs --tail 20 hotel-manager
```

For zero-downtime updates in the future, consider a blue-green approach with a second container. For now, the 60-90s rebuild window is acceptable for a single-property deployment.

---

## 5. Backup & Restore

### Automatic Daily Backup (cron)

```bash
# Make the script executable
chmod +x /opt/hotel-manager/scripts/backup-db.sh

# Add cron job (runs daily at 2:00 AM)
crontab -e
# Add this line:
0 2 * * * /opt/hotel-manager/scripts/backup-db.sh >> /var/log/hotel-backup.log 2>&1
```

The script:
- Uses `sqlite3 .backup` for atomic, WAL-safe copies
- Stores backups in `/opt/hotel-manager/backups/`
- Rotates automatically: deletes backups older than 7 days

### Manual Backup

```bash
sqlite3 /opt/hotel-manager/data/hotel.db ".backup /opt/hotel-manager/backups/manual-$(date +%Y%m%d).db"
```

### Restore from Backup

```bash
# Stop the app to prevent writes during restore
docker compose stop app

# Copy backup over the live database
cp /opt/hotel-manager/backups/<backup-file>.db /opt/hotel-manager/data/hotel.db
chown 1001:1001 /opt/hotel-manager/data/hotel.db

# Restart
docker compose start app

# Verify
curl -k https://10.10.90.11/api/health
```

### Remote Backup (template)

```bash
# rsync backups to a remote server (add to cron after the backup script)
rsync -az /opt/hotel-manager/backups/ user@backup-server:/backups/hotel-manager/
```

---

## 6. HTTPS Certificate Setup

Caddy automatically generates an internal CA and issues a self-signed certificate for `10.10.90.11`. Browsers will show a security warning on first visit because the CA is not publicly trusted.

### Accepting the Warning (quick)

Navigate to `https://10.10.90.11` and click "Advanced" -> "Proceed" (Chrome) or "Accept the Risk" (Firefox).

### Installing the Root CA (permanent fix)

Export the Caddy root certificate:

```bash
docker compose cp caddy:/data/caddy/pki/authorities/local/root.crt ./caddy-root.crt
```

Then install `caddy-root.crt` on client devices:

| Platform | Steps |
|----------|-------|
| **Windows** | Double-click `caddy-root.crt` -> Install Certificate -> Local Machine -> "Trusted Root Certification Authorities" |
| **macOS** | Double-click -> Keychain Access opens -> Add to "System" keychain -> Double-click cert -> Trust -> "Always Trust" |
| **Android** | Settings -> Security -> Encryption & Credentials -> Install a certificate -> CA certificate -> Select file |
| **iOS** | AirDrop or email the `.crt` file -> Settings -> General -> VPN & Device Management -> Install profile -> Settings -> General -> About -> Certificate Trust Settings -> Enable |

After installing the root CA, browsers on that device will trust all Caddy-issued certificates without warnings.

---

## 7. Cloudflare Tunnel (Remote Access)

Cloudflare Tunnel (`cloudflared`) runs as a system service on CT101, **not** inside Docker. It provides remote HTTPS access with a real Cloudflare-issued certificate.

### Setup

cloudflared is configured separately. The tunnel should point to the Next.js app directly:

```bash
# In the cloudflared config (usually /etc/cloudflared/config.yml):
tunnel: <tunnel-id>
credentials-file: /etc/cloudflared/<tunnel-id>.json

ingress:
  - hostname: hotel.yourdomain.com
    service: http://localhost:3000
  - service: http_status:404
```

This bypasses Caddy (Cloudflare handles TLS for remote connections). The app's own login page handles authentication -- no Cloudflare Access gate is needed.

### Useful Commands

```bash
# Check tunnel status
cloudflared tunnel list

# Run tunnel (if not a service)
cloudflared tunnel run <tunnel-name>

# View real-time logs
journalctl -u cloudflared -f
```

---

## 8. Troubleshooting

### App won't start

```bash
docker logs hotel-manager
```

**Common causes:**
- Missing environment variables: check `.env` has all required values
- SQLite permission error: `chown -R 1001:1001 /opt/hotel-manager/data/`
- Port conflict: another service on port 3000 inside the container (unlikely)

### "Disconnected from Home Assistant"

```bash
# Test HA connectivity from inside the container
docker exec hotel-manager wget -qO- http://10.10.90.10:8123/api/ 2>&1 | head -5
```

- Verify `HA_URL` is correct and reachable from CT101's network
- Verify `HA_TOKEN` is valid (not expired or revoked)
- Check HA is running: `curl http://10.10.90.10:8123/api/`

### Database locked / readonly

```bash
# Check file permissions
ls -la /opt/hotel-manager/data/
# Should be owned by 1001:1001

# Fix permissions
chown -R 1001:1001 /opt/hotel-manager/data/

# Restart to pick up
docker compose restart app
```

### Caddy certificate issues

```bash
docker logs hotel-caddy
```

- Verify the IP address in `Caddyfile` matches CT101's actual IP
- If IP changed: edit `Caddyfile`, then `docker compose restart caddy`

### PWA not installing

The PWA requires HTTPS to install:
- **On LAN:** Use `https://10.10.90.11` (Caddy provides self-signed HTTPS)
- **Remote:** Use the Cloudflare Tunnel URL (real HTTPS)
- **Android:** Must access via Cloudflare Tunnel for the install prompt (Chrome requires trusted TLS)
- **iOS:** Works with self-signed certs if the root CA is installed

### Container keeps restarting

```bash
# Check last 50 lines of logs
docker logs --tail 50 hotel-manager

# Check resource usage
docker stats hotel-manager --no-stream
```

- Expected memory: ~200-300 MB (Alpine + Node.js standalone)
- If OOM killed: increase container memory limit or check for memory leaks in logs

---

## 9. New Client Replication

The deployment is designed to be replicable for additional properties. Here's what changes per client vs what stays the same.

### Changes per client

| File | What to change |
|------|---------------|
| `.env` | `HA_URL`, `HA_TOKEN`, `AUTH_SECRET`, `PROPERTY_NAME`, `NEXT_PUBLIC_PROPERTY_NAME` |
| `Caddyfile` | IP address (replace `10.10.90.11` with the new server's LAN IP) |
| cloudflared config | Tunnel ID, hostname |

### Stays the same

- `Dockerfile` — identical across all deployments
- `docker-compose.yml` — no client-specific config
- `scripts/backup-db.sh` — same paths (assuming `/opt/hotel-manager/`)
- All application code

### Replication steps

```bash
# On the new server:
ssh root@<new-server-ip>
cd /opt
git clone <repo-url> hotel-manager
cd hotel-manager

# Configure for this client
cp .env.example .env
nano .env
# Set: HA_URL, HA_TOKEN, AUTH_SECRET, PROPERTY_NAME, NEXT_PUBLIC_PROPERTY_NAME

# Update Caddyfile IP
sed -i "s/10.10.90.11/<new-server-ip>/g" Caddyfile

# Create data directory
mkdir -p data
chown -R 1001:1001 data

# Build and start
docker compose up -d --build

# Verify
curl -k https://<new-server-ip>/api/health
```

---

## 10. Container Management Quick Reference

```bash
# Start all services
docker compose up -d

# Stop all services
docker compose down

# Rebuild after code changes
docker compose up -d --build

# View logs (follow mode)
docker compose logs -f

# View app logs only
docker logs -f hotel-manager

# View Caddy logs only
docker logs -f hotel-caddy

# Restart a single service
docker compose restart app
docker compose restart caddy

# Check health status
docker compose ps

# Shell into running container (debugging)
docker exec -it hotel-manager sh

# Check disk usage
docker system df
```
