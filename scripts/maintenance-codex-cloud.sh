#!/usr/bin/env bash
# Lightweight maintenance for Codex Cloud tasks.
# Runs before each task to refresh deps and ensure Roslyn runner is built.

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

export BUN_INSTALL="${BUN_INSTALL:-$HOME/.bun}"
export PATH="$BUN_INSTALL/bin:$PATH"

echo "[maintenance] bun install (frozen)..."
bun install --frozen-lockfile

echo "[maintenance] rebuild Roslyn runner..."
dotnet build -c Release roslyn-runner/RoslynRunner.csproj --nologo

echo "[maintenance] done."
