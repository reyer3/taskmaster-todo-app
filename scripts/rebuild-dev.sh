#!/bin/bash

echo "🧹 Limpiando entorno de desarrollo..."
docker compose -f docker-compose.local.yml down

echo "🗑️ Eliminando imágenes antiguas..."
docker image prune -af --filter "until=1h"

echo "🏗️ Reconstruyendo imágenes..."
docker compose -f docker-compose.local.yml build --no-cache

echo "🚀 Iniciando servicios..."
docker compose -f docker-compose.local.yml up -d

echo "📋 Estado de los servicios:"
docker compose -f docker-compose.local.yml ps

echo "📝 Logs (presiona Ctrl+C para salir):"
docker compose -f docker-compose.local.yml logs -f
