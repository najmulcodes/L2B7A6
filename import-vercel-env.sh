#!/usr/bin/env bash

set -euo pipefail

ENV_FILE=".env"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "❌ .env file not found!"
  exit 1
fi

echo "🔐 Importing .env into Vercel..."
echo

while IFS= read -r line || [[ -n "$line" ]]; do

  # Remove UTF-8 BOM from first line
  line="${line#$'\xef\xbb\xbf'}"

  # Trim leading whitespace
  line="${line#"${line%%[![:space:]]*}"}"

  # Skip blank lines and comments
  [[ -z "$line" || "$line" == \#* ]] && continue

  # Support: export VARIABLE=value
  if [[ "$line" == export\ * ]]; then
    line="${line#export }"
  fi

  # Must contain =
  [[ "$line" != *=* ]] && continue

  # Split only at the FIRST =
  name="${line%%=*}"
  value="${line#*=}"

  # Trim whitespace from variable name
  name="$(printf '%s' "$name" | sed 's/[[:space:]]*$//')"

  # Validate variable name
  if [[ ! "$name" =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]]; then
    echo "⚠️  Skipping invalid variable name: $name"
    continue
  fi

  # Remove surrounding quotes from value
  if [[ "$value" =~ ^\".*\"$ ]]; then
    value="${value:1:${#value}-2}"

    # Decode common dotenv escapes inside double quotes
    value="${value//\\n/$'\n'}"
    value="${value//\\r/$'\r'}"
    value="${value//\\t/$'\t'}"
    value="${value//\\\"/\"}"
    value="${value//\\\\/\\}"

  elif [[ "$value" =~ ^\'.*\'$ ]]; then
    value="${value:1:${#value}-2}"
  fi

  # Skip variables we intentionally kept in Vercel
  case "$name" in
    PORT|CORS_ORIGIN|DATABASE_URL|DIRECT_URL|NODE_ENV)
      echo "⏭️  Skipping $name"
      continue
      ;;
  esac

  echo "➡️  Adding $name to Production + Preview..."

  # Pipe the value to Vercel so it is never passed as a shell argument
  printf '%s' "$value" | vercel env add "$name" production,preview

  echo "✅ $name added"
  echo

done < "$ENV_FILE"

echo "🎉 Finished importing environment variables!"
echo
echo "Verify with:"
echo "  vercel env ls"
