#!/usr/bin/env bash
set -eo pipefail

echo "========================================================================"
echo "  🎬 NovaCut AI Studio — 1-Click Auto Updater (macOS)"
echo "  سیستم به‌روزرسانی خودکار استودیو نوواکات"
echo "========================================================================"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$REPO_ROOT"

if command -v git >/dev/null 2>&1; then
    echo "[INFO] Checking for latest updates from GitHub..."
    git fetch origin main || true
    git pull origin main || echo "[WARN] Git pull skipped or uncommitted changes present."
fi

echo "[INFO] Checking dependencies..."
npm install --no-audit --no-fund --prefer-offline || true

echo "[INFO] Rebuilding TypeScript server..."
npm run build

echo "[INFO] Syncing CEP extension files..."
CEP_DIR="$HOME/Library/Application Support/Adobe/CEP/extensions/NovaCutBridgeCEP"
LEGACY_DIR="$HOME/Library/Application Support/Adobe/CEP/extensions/MCPBridgeCEP"
mkdir -p "$CEP_DIR" "$LEGACY_DIR"
cp -R cep-plugin/* "$CEP_DIR/"
cp -R cep-plugin/* "$LEGACY_DIR/"

echo "[INFO] Verifying Adobe PlayerDebugMode..."
for ver in 9 10 11 12 13 14 15 16 17 18 19 20 21 22; do
    defaults write "com.adobe.CSXS.$ver" PlayerDebugMode 1 2>/dev/null || true
done

echo ""
echo "[INFO] Running diagnostics..."
node dist/cli.js --doctor

echo ""
echo "🎉 UPDATE COMPLETE! NovaCut AI Studio is fully up to date."
