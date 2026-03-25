#!/bin/bash
# RPM Pro — Deploy com cache busting
MSG="${1:-deploy}"
TIMESTAMP=$(date +%s)

# Cache busting nos HTML
for f in *.html; do
  [ -f "$f" ] && sed -i "s/\.js\"/\.js?v=$TIMESTAMP\"/g; s/\.css\"/\.css?v=$TIMESTAMP\"/g" "$f"
done

git add -A
git commit -m "$MSG"
git push origin dev

# Merge dev → main
git checkout main
git merge dev --no-edit
git push origin main
git checkout dev

echo ""
echo "RPM Pro atualizado e no ar!"
