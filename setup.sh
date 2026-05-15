#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# Forefathers Nutrition Calculator — First-Time Machine Setup
# Run this once on a new computer. Claude can run it automatically.
# ─────────────────────────────────────────────────────────────────────────────

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo ""
echo "🥩  Forefathers Nutrition Calculator — Setup"
echo "─────────────────────────────────────────────"
echo ""

# ── Step 1: Check Node.js ─────────────────────────────────────────────────────
echo "Checking for Node.js..."
if ! command -v node &> /dev/null; then
  echo -e "${RED}✗ Node.js is not installed.${NC}"
  echo ""
  echo "Please install it first:"
  echo "  → Go to https://nodejs.org"
  echo "  → Download the LTS version"
  echo "  → Install it, then run this script again"
  exit 1
fi
echo -e "${GREEN}✓ Node.js $(node --version) found${NC}"

# ── Step 2: Check for .env ────────────────────────────────────────────────────
echo ""
echo "Checking for .env credentials file..."
if [ ! -f ".env" ]; then
  echo -e "${YELLOW}⚠  No .env file found.${NC}"
  echo ""
  echo "You need the credentials file to continue."
  echo "Dan sent you a file called .env — place it in this folder:"
  echo "  $(pwd)"
  echo ""
  echo "Once you've done that, run this script again."
  exit 1
fi
echo -e "${GREEN}✓ .env credentials file found${NC}"

# ── Step 3: Install dependencies ─────────────────────────────────────────────
echo ""
echo "Installing project dependencies..."
npm install --silent
echo -e "${GREEN}✓ Dependencies installed${NC}"

# ── Step 4: Run tests ─────────────────────────────────────────────────────────
echo ""
echo "Running tests to verify everything is working..."
if npm test -- --reporter=dot 2>&1 | tail -5; then
  echo -e "${GREEN}✓ All tests passing${NC}"
else
  echo -e "${RED}✗ Some tests failed. Something may be wrong with the setup.${NC}"
  echo "  Ask Claude to run: npm test -- --reporter=verbose"
fi

# ── Step 5: Cloudflare login ──────────────────────────────────────────────────
echo ""
echo "─────────────────────────────────────────────"
echo ""
echo -e "${YELLOW}One last step — connecting to Cloudflare:${NC}"
echo ""
echo "This opens a browser window. Log in with:"
echo "  matt.dishon@forefatherssteaks.com"
echo ""
echo "Press Enter when ready, or Ctrl+C to skip (you can do this later)..."
read -r
npx wrangler login

# ── Done ──────────────────────────────────────────────────────────────────────
echo ""
echo "─────────────────────────────────────────────"
echo -e "${GREEN}"
echo "✓ Setup complete! Your computer is ready."
echo ""
echo "What Claude can do for you from here:"
echo "  • Deploy changes to the live website"
echo "  • Update the cache when you change something in Airtable"
echo "  • Run tests to make sure nothing is broken"
echo "  • Deploy Worker updates"
echo -e "${NC}"
