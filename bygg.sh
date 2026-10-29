#!/bin/bash
TICKET=$1
if [ -z "$TICKET" ]; then
  echo "Ange en ticket, t.ex: ./bygg.sh TCK-TEST-001"
  exit 1
fi

echo "🚀 Startar bygget för $TICKET..."
npx tsx --env-file=.env scripts/run-planera-live.ts $TICKET
EXIT_CODE=$?

echo "📦 Synkar tillståndet till Git (Exit kod: $EXIT_CODE)..."
git add .
git commit -m "Auto-sync WAL och körtid för $TICKET (Exit $EXIT_CODE)"
# För att pusha till GitHub, avkommentera nästa rad:
# git push origin main

if [ $EXIT_CODE -ne 0 ]; then
  echo "❌ Bygget avslutades med fel. Koden är nu på GitHub för inspektion."
else
  echo "✅ Bygget slutfördes framgångsrikt."
fi

exit $EXIT_CODE
