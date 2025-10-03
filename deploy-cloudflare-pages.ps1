# Script para desplegar en Cloudflare Pages usando Wrangler CLI
# ALTERNATIVA al método del Dashboard (PowerShell para Windows)

Write-Host "🚀 Despliegue a Cloudflare Pages - Script Automático" -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host ""

# Verificar que existe npm
try {
    $npmVersion = npm --version
    Write-Host "✅ npm encontrado (versión: $npmVersion)" -ForegroundColor Green
} catch {
    Write-Host "❌ Error: npm no está instalado" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Verificar que existe el directorio dist
if (-Not (Test-Path "dist")) {
    Write-Host "⚠️  Directorio dist/ no encontrado" -ForegroundColor Yellow
    Write-Host "📦 Ejecutando build..." -ForegroundColor Cyan
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Error en el build. Corrige los errores y vuelve a intentar." -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✅ Directorio dist/ encontrado" -ForegroundColor Green
}

Write-Host ""
Write-Host "📋 CONFIGURACIÓN REQUERIDA:" -ForegroundColor Yellow
Write-Host "============================" -ForegroundColor Yellow
Write-Host ""
Write-Host "Antes de continuar, asegúrate de tener:" -ForegroundColor White
Write-Host "1. Cuenta en Cloudflare (https://dash.cloudflare.com/)" -ForegroundColor White
Write-Host "2. Tu clave anónima de Supabase" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  Este script requiere que instales Wrangler:" -ForegroundColor Yellow
Write-Host "   npm install -g wrangler" -ForegroundColor Cyan
Write-Host ""
Write-Host "⚠️  Luego debes autenticarte:" -ForegroundColor Yellow
Write-Host "   wrangler login" -ForegroundColor Cyan
Write-Host ""
Write-Host "⚠️  Y configurar las variables de entorno en Cloudflare Dashboard:" -ForegroundColor Yellow
Write-Host "   1. Ve a https://dash.cloudflare.com/" -ForegroundColor White
Write-Host "   2. Workers & Pages > Tu proyecto > Settings > Environment Variables" -ForegroundColor White
Write-Host "   3. Agrega VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY" -ForegroundColor White
Write-Host ""
Write-Host "==================================================" -ForegroundColor Magenta
Write-Host "📚 RECOMENDACIÓN:" -ForegroundColor Magenta
Write-Host "==================================================" -ForegroundColor Magenta
Write-Host ""
Write-Host "Es MÁS FÁCIL usar el Dashboard de Cloudflare que este script CLI." -ForegroundColor Yellow
Write-Host "Sigue las instrucciones en: PASOS_URGENTES_CLOUDFLARE.md" -ForegroundColor Cyan
Write-Host ""
Write-Host "Si prefieres continuar con CLI, ejecuta manualmente:" -ForegroundColor White
Write-Host ""
Write-Host "  npm install -g wrangler" -ForegroundColor Cyan
Write-Host "  wrangler login" -ForegroundColor Cyan
Write-Host "  wrangler pages deploy dist --project-name=ghq-12" -ForegroundColor Cyan
Write-Host ""
Write-Host "Luego agrega las variables de entorno en el Dashboard." -ForegroundColor Yellow
Write-Host ""

# Preguntar si desea continuar
$respuesta = Read-Host "¿Deseas instalar Wrangler y continuar con el despliegue CLI? (s/N)"

if ($respuesta -eq "s" -or $respuesta -eq "S") {
    Write-Host ""
    Write-Host "📦 Instalando Wrangler globalmente..." -ForegroundColor Cyan
    npm install -g wrangler
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Error al instalar Wrangler" -ForegroundColor Red
        exit 1
    }
    
    Write-Host ""
    Write-Host "✅ Wrangler instalado correctamente" -ForegroundColor Green
    Write-Host ""
    Write-Host "🔐 Abriendo navegador para autenticación..." -ForegroundColor Cyan
    Write-Host "   Completa la autenticación en el navegador y vuelve aquí." -ForegroundColor Yellow
    Write-Host ""
    
    wrangler login
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Error en la autenticación" -ForegroundColor Red
        exit 1
    }
    
    Write-Host ""
    Write-Host "✅ Autenticación exitosa" -ForegroundColor Green
    Write-Host ""
    Write-Host "🚀 Desplegando a Cloudflare Pages..." -ForegroundColor Cyan
    Write-Host ""
    
    wrangler pages deploy dist --project-name=ghq-12
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "❌ Error en el despliegue" -ForegroundColor Red
        Write-Host ""
        Write-Host "Verifica:" -ForegroundColor Yellow
        Write-Host "1. Que estés autenticado con 'wrangler whoami'" -ForegroundColor White
        Write-Host "2. Que el proyecto 'ghq-12' exista o usa otro nombre" -ForegroundColor White
        Write-Host "3. Que tengas permisos en tu cuenta de Cloudflare" -ForegroundColor White
        exit 1
    }
    
    Write-Host ""
    Write-Host "✅ ¡Despliegue exitoso!" -ForegroundColor Green
    Write-Host ""
    Write-Host "⚠️  IMPORTANTE: Ahora debes configurar las variables de entorno:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "1. Ve a https://dash.cloudflare.com/" -ForegroundColor White
    Write-Host "2. Workers & Pages > ghq-12 > Settings > Environment Variables" -ForegroundColor White
    Write-Host "3. Agrega:" -ForegroundColor White
    Write-Host "   - VITE_SUPABASE_URL = https://janzboqcdloznjsglvnw.supabase.co" -ForegroundColor Cyan
    Write-Host "   - VITE_SUPABASE_ANON_KEY = [tu-clave-de-supabase]" -ForegroundColor Cyan
    Write-Host "4. Guarda y re-despliega (Retry deployment)" -ForegroundColor White
    Write-Host ""
    
} else {
    Write-Host ""
    Write-Host "👍 Usa el Dashboard de Cloudflare siguiendo: PASOS_URGENTES_CLOUDFLARE.md" -ForegroundColor Cyan
    Write-Host ""
}

