#!/bin/bash

# Script para desplegar en Cloudflare Pages usando Wrangler CLI
# ALTERNATIVA al método del Dashboard

echo "🚀 Despliegue a Cloudflare Pages - Script Automático"
echo "===================================================="
echo ""

# Verificar que existe npm
if ! command -v npm &> /dev/null
then
    echo "❌ Error: npm no está instalado"
    exit 1
fi

echo "✅ npm encontrado"
echo ""

# Verificar que existe el directorio dist
if [ ! -d "dist" ]; then
    echo "⚠️  Directorio dist/ no encontrado"
    echo "📦 Ejecutando build..."
    npm run build
    if [ $? -ne 0 ]; then
        echo "❌ Error en el build. Corrige los errores y vuelve a intentar."
        exit 1
    fi
else
    echo "✅ Directorio dist/ encontrado"
fi

echo ""
echo "📋 CONFIGURACIÓN REQUERIDA:"
echo "============================"
echo ""
echo "Antes de continuar, asegúrate de tener:"
echo "1. Cuenta en Cloudflare (https://dash.cloudflare.com/)"
echo "2. Tu clave anónima de Supabase"
echo ""
echo "⚠️  Este script requiere que instales Wrangler:"
echo "   npm install -g wrangler"
echo ""
echo "⚠️  Luego debes autenticarte:"
echo "   wrangler login"
echo ""
echo "⚠️  Y configurar las variables de entorno en Cloudflare Dashboard:"
echo "   1. Ve a https://dash.cloudflare.com/"
echo "   2. Workers & Pages > Tu proyecto > Settings > Environment Variables"
echo "   3. Agrega VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY"
echo ""
echo "=================================================="
echo "📚 RECOMENDACIÓN:"
echo "=================================================="
echo ""
echo "Es MÁS FÁCIL usar el Dashboard de Cloudflare que este script CLI."
echo "Sigue las instrucciones en: PASOS_URGENTES_CLOUDFLARE.md"
echo ""
echo "Si prefieres continuar con CLI, ejecuta manualmente:"
echo ""
echo "  npm install -g wrangler"
echo "  wrangler login"
echo "  wrangler pages deploy dist --project-name=ghq-12"
echo ""
echo "Luego agrega las variables de entorno en el Dashboard."
echo ""

