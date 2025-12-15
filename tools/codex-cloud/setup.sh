#!/usr/bin/env bash
# Bootstrap a Codex Cloud runner so Expert Builder can build and test.
# Installs Bun, .NET 9 SDK, restores JS/TS deps and pre-builds the Roslyn runner.

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

# Use sudo when available (Codex Cloud images often run as root).
SUDO=""
if command -v sudo >/dev/null 2>&1; then
  SUDO="sudo"
fi

if command -v apt-get >/dev/null 2>&1; then
  $SUDO apt-get update -y
  $SUDO apt-get install -y --no-install-recommends \
    ca-certificates curl gnupg build-essential unzip

  # .NET 9 SDK (needed by roslyn-runner). Skip if already present.
  if ! command -v dotnet >/dev/null 2>&1 || ! dotnet --list-sdks | grep -q "^9"; then
    curl -fsSL https://packages.microsoft.com/config/debian/12/packages-microsoft-prod.deb -o /tmp/msprod.deb
    $SUDO dpkg -i /tmp/msprod.deb
    rm /tmp/msprod.deb
    $SUDO apt-get update -y
    $SUDO apt-get install -y dotnet-sdk-9.0
  fi
else
  echo "apt-get not found; install .NET 9 SDK manually for your distro." >&2
fi

# Bun install (used for all JS/TS workflows). Adds to PATH for the rest of this script.
export BUN_INSTALL="${BUN_INSTALL:-$HOME/.bun}"
export PATH="$BUN_INSTALL/bin:$PATH"
if ! command -v bun >/dev/null 2>&1; then
  curl -fsSL https://bun.sh/install | bash
  export PATH="$BUN_INSTALL/bin:$PATH"
fi

cd "$ROOT_DIR"

echo "Installing JS/TS dependencies with bun..."
bun install --frozen-lockfile

echo "Restoring and building Roslyn runner..."
dotnet restore "$ROOT_DIR/roslyn-runner/RoslynRunner.csproj"
dotnet build -c Release "$ROOT_DIR/roslyn-runner/RoslynRunner.csproj" --nologo

echo "Done. You can now run: bun run dev"

