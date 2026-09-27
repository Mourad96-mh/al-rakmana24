#!/usr/bin/env bash
# Deploy the COMMITTED state of HEAD to the VPS and rebuild there.
# Uncommitted changes are not shipped — commit first (règle d'or #6).
#
#   bash scripts/deploy.sh
#
# The server keeps its own .env in $DIR; everything else is replaced.
set -euo pipefail

HOST="${DEPLOY_HOST:-root@72.62.155.76}"
DIR="${DEPLOY_DIR:-/opt/al-raqmana24}"

if ! git diff --quiet HEAD; then
  echo "Attention : des modifications non commitees ne seront PAS deployees." >&2
fi
echo "Deploiement de $(git rev-parse --short HEAD) vers $HOST:$DIR"

git archive --format=tar HEAD | ssh "$HOST" "
  set -e
  mkdir -p '$DIR' && cd '$DIR'
  test -f .env || { echo '.env manquant dans $DIR' >&2; exit 1; }
  find . -mindepth 1 -maxdepth 1 ! -name .env -exec rm -rf {} +
  tar -x
  docker compose up -d --build --remove-orphans
  docker image prune -f >/dev/null
  docker compose ps
"
