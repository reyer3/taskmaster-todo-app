#!/bin/bash

echo "🔍 Verificando archivos de estilo y configuración..."

# Detener y eliminar solo el contenedor frontend
docker compose -f docker-compose.local.yml stop frontend
docker compose -f docker-compose.local.yml rm -f frontend

# Reconstruir solo el frontend
echo "🏗️ Reconstruyendo frontend..."
docker compose -f docker-compose.local.yml build --no-cache frontend

# Iniciar el frontend
echo "🚀 Iniciando frontend..."
docker compose -f docker-compose.local.yml up -d frontend

# Ejecutar comandos para verificar configuración dentro del contenedor
echo "🔧 Verificando configuración dentro del contenedor..."
docker compose -f docker-compose.local.yml exec frontend sh -c "ls -la /app/"
docker compose -f docker-compose.local.yml exec frontend sh -c "cat /app/postcss.config.js"
docker compose -f docker-compose.local.yml exec frontend sh -c "cat /app/tailwind.config.js"
docker compose -f docker-compose.local.yml exec frontend sh -c "npm list | grep -E 'tailwindcss|postcss|autoprefixer'"

echo "📝 Logs del frontend (presiona Ctrl+C para salir):"
docker compose -f docker-compose.local.yml logs -f frontend
