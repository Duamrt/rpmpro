#!/bin/bash
# RPM Pro — Deploy com cache busting (padrão EDR/NaRegua)
MSG="${1:-deploy}"
VERSION=$(date +%m%d%H%M)

echo "RPM Pro — Deploy v$VERSION"
echo "=========================="

# Cache busting: atualiza ?v= em todos os HTML (raiz + v2/)
for f in *.html v2/*.html; do
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

# Fechar itens no DM Stack — keyword sempre do commit, NUNCA $2 (seria o sistema inteiro)
DMS_SHORTID=$(echo "$MSG" | grep -oE '#[0-9a-fA-F]{8}' | head -1)
DMS_KWS=$(echo "$MSG" | \
  sed 's/[áàâã]/a/g; s/[éêè]/e/g; s/[íî]/i/g; s/[óôõ]/o/g; s/[úû]/u/g; s/ç/c/g' | \
  tr '[:upper:]' '[:lower:]' | \
  grep -oE '[a-z]{4,}' | \
  grep -vE '^(cache|busting|deploy|versao|fixes|update|remove|corrige|corrigir|adiciona|adicionar|atualiza|atualizar|insere|inserir|agora|gravam|bloquear|duplicata|lancamento|lancamentos|codigo|sistema|diaria|diarias|modal|valor|campo|botao|registro|registros|dividida|melhoria|melhorias|historico|feature|features|titulo|status|dados|texto|abrir|fechar|criar|salvar|editar|deletar|listar|exibir|mostrar|usando|agente|agentes|commit|antes|depois|quando|entre|sobre|todos|todas|telas|tela|lista|novo|nova|item|itens)$' | \
  tr '\n' ' ' | sed 's/[[:space:]]*$//')
DMS_ARGS="${DMS_SHORTID} ${DMS_KWS}"
DMS_ARGS="${DMS_ARGS## }"
if [ -n "$DMS_ARGS" ]; then
  bash "$HOME/dms-resolve.sh" "$DMS_ARGS" "RPM"
fi

# Registrar deploy no DM Stack
source "$HOME/.dms-config" 2>/dev/null
if [ -n "$DMS_SERVICE_KEY" ]; then
  DEPLOY_JSON="{\"sistema\":\"RPM\",\"versao\":\"rpm-$VERSION\",\"mensagem\":$(echo "$MSG" | python3 -c 'import sys,json; print(json.dumps(sys.stdin.read().strip()))')}"
  curl -s -X POST "$DMS_URL/rest/v1/deploys" \
    -H "apikey: $DMS_SERVICE_KEY" \
    -H "Authorization: Bearer $DMS_SERVICE_KEY" \
    -H "Content-Type: application/json" \
    -H "Prefer: return=minimal" \
    -d "$DEPLOY_JSON" > /dev/null && echo "deploy registrado no DM Stack"
fi
