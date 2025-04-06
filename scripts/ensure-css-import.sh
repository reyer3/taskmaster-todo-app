#!/bin/bash

# Revisar el archivo main.jsx o similar para asegurarse de que importa el index.css
MAIN_FILE=$(find ./frontend/src -name "main.jsx" -o -name "main.tsx" -o -name "index.jsx" -o -name "index.tsx" | head -n 1)

if [ -z "$MAIN_FILE" ]; then
  echo "⚠️ No se pudo encontrar el archivo principal en ./frontend/src"
  exit 1
fi

echo "📝 Verificando importación de CSS en $MAIN_FILE"

# Verificar si ya importa index.css
if grep -q "import.*index.css" "$MAIN_FILE"; then
  echo "✅ El archivo $MAIN_FILE ya importa index.css"
else
  # Añadir la importación de index.css al principio del archivo
  echo "⚙️ Añadiendo importación de index.css a $MAIN_FILE"
  TMP_FILE=$(mktemp)
  echo "import './index.css';" > "$TMP_FILE"
  cat "$MAIN_FILE" >> "$TMP_FILE"
  mv "$TMP_FILE" "$MAIN_FILE"
  echo "✅ Importación añadida a $MAIN_FILE"
fi

echo "🔄 Reconstruyendo el frontend para aplicar los cambios..."
./scripts/fix-frontend-styles.sh
