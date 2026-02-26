#!/bin/bash
# diagnose-production.sh — run on CT101 to check common production issues
set -e

echo "=== Hotel Manager Production Diagnostics ==="
echo ""

# 1. Check Node.js
echo "[1/7] Node.js version:"
node -v || echo "  ERROR: Node.js not found"

# 2. Check PM2 process
echo ""
echo "[2/7] PM2 process status:"
pm2 jlist 2>/dev/null | node -e "
  const d = JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));
  const app = d.find(p => p.name === 'hotel-manager');
  if (!app) { console.log('  ERROR: hotel-manager not in PM2'); process.exit(1); }
  console.log('  Status:', app.pm2_env.status);
  console.log('  Uptime:', Math.round((Date.now() - app.pm2_env.pm_uptime)/1000), 'seconds');
  console.log('  Restarts:', app.pm2_env.restart_time);
" || echo "  PM2 not running or parse error"

# 3. Check .env file
echo ""
echo "[3/7] Environment file:"
ENV_FILE="/opt/hotel-manager/.env"
if [ -f "$ENV_FILE" ]; then
  echo "  .env exists"
  for var in HA_URL HA_TOKEN AUTH_SECRET DB_PATH; do
    if grep -q "^${var}=" "$ENV_FILE" 2>/dev/null; then
      echo "  $var: set"
    else
      echo "  $var: MISSING"
    fi
  done
else
  echo "  ERROR: .env file not found at $ENV_FILE"
fi

# 4. Check database
echo ""
echo "[4/7] Database:"
DB_PATH=$(grep "^DB_PATH=" "$ENV_FILE" 2>/dev/null | cut -d= -f2-)
if [ -n "$DB_PATH" ] && [ -f "$DB_PATH" ]; then
  echo "  Database exists at $DB_PATH"
  echo "  Size: $(du -h "$DB_PATH" | cut -f1)"
else
  echo "  WARNING: Database not found at ${DB_PATH:-'(DB_PATH not set)'}"
  echo "  Will be created on first request"
fi

# 5. Check health endpoint
echo ""
echo "[5/7] Health endpoint:"
HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health 2>/dev/null)
if [ "$HEALTH" = "200" ]; then
  echo "  /api/health: OK (200)"
else
  echo "  /api/health: FAILED (HTTP $HEALTH)"
fi

# 6. Check a page load
echo ""
echo "[6/7] Page load test:"
PAGE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/login 2>/dev/null)
if [ "$PAGE" = "200" ]; then
  echo "  /login page: OK (200)"
elif [ "$PAGE" = "302" ]; then
  echo "  /login page: OK (302 redirect)"
else
  echo "  /login page: FAILED (HTTP $PAGE)"
  echo "  Check: pm2 logs hotel-manager --lines 20"
fi

# 7. Check HA connectivity
echo ""
echo "[7/7] Home Assistant connectivity:"
HA_URL=$(grep "^HA_URL=" "$ENV_FILE" 2>/dev/null | cut -d= -f2-)
if [ -n "$HA_URL" ]; then
  HA_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$HA_URL/api/" 2>/dev/null)
  if [ "$HA_STATUS" = "401" ] || [ "$HA_STATUS" = "200" ]; then
    echo "  HA reachable at $HA_URL (HTTP $HA_STATUS)"
  else
    echo "  HA NOT reachable at $HA_URL (HTTP $HA_STATUS)"
  fi
else
  echo "  HA_URL not set"
fi

echo ""
echo "=== Done ==="
