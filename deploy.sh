#!/bin/bash
# RPM Pro — Deploy com cache busting (padrão EDR/NaRegua)
MSG="${1:-deploy}"
VERSION=$(date +%m%d%H%M)

echo "RPM Pro — Deploy v$VERSION"
echo "=========================="

# Cache busting: atualiza ?v= em todos os HTML
for f in *.html; do
  if [ -f "$f" ]; then
    # Atualiza versão existente ou adiciona
    sed -i "s/\.js?v=[0-9]*/\.js?v=$VERSION/g" "$f"
    sed -i "s/\.css?v=[0-9]*/\.css?v=$VERSION/g" "$f"
    # Adiciona ?v= onde não tem (primeira vez)
    sed -i "s/\.js\"/\.js?v=$VERSION\"/g" "$f"
    sed -i "s/\.css\"/\.css?v=$VERSION\"/g" "$f"
    echo "  ✓ $f"
  fi
done

# Git
git add -A
git commit -m "$MSG — v$VERSION" || echo "Nada pra comitar"

# Sync main = dev
git push origin dev
git checkout main
git reset --hard dev
git push --force-with-lease origin main
git checkout dev

echo ""
echo "=========================="
echo "RPM Pro v$VERSION no ar!"
echo "https://rpmpro.com.br"
