# =========================================
# CONFIGURACIÓN GENERAL
# =========================================

$PROJECT_ROOT = Get-Location
$RESTORE_DIR  = "$PROJECT_ROOT\restore"

$REMOTE_USER = "distribuida"
$REMOTE_HOST = "server.distribuidauce.org"
$REMOTE_PATH = "/home/distribuida/Documents/distribuida1/Ramses_Riofrio/qa"
$SSH_PROXY   = "cloudflared access ssh --hostname server.distribuidauce.org"

# PostgreSQL
$PG_USER = "admin"   # usa el real de tu .env

$POSTGRES_TARGETS = @(
  @{ Name="classroom_db"; Container="classroom_db_container"; Db="classroom_db" },
  @{ Name="users_db";     Container="users_db_container";     Db="users_db"     },
  @{ Name="booking_db";   Container="booking_db_container";   Db="booking_db"   }
)

# MongoDB
$MONGO_CONTAINER = "mongodb_container"
$MONGO_AUTH_DB = "admin"

# =========================================
# PASO 0 — Preparación
# =========================================

Write-Host "⏹️ Deteniendo servicios de aplicación..."
docker compose stop classroom-service booking-command booking-query user-service api-gateway | Out-Null

Write-Host "▶️ Asegurando bases levantadas..."
docker compose up -d classroom-db users-db booking-db mongodb | Out-Null

mkdir $RESTORE_DIR -Force | Out-Null

# =========================================
# PASO 1 — Descargar backups del servidor
# =========================================

Write-Host "⬇️ Descargando backups desde on-prem..."

scp -r `
  -o "ProxyCommand=$SSH_PROXY" `
  "${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_PATH}" `
  "$RESTORE_DIR"

Write-Host "✅ Backups descargados"

# =========================================
# PASO 2 — RESTORE POSTGRESQL
# =========================================

foreach ($t in $POSTGRES_TARGETS) {
  $name = $t.Name
  $container = $t.Container
  $db = $t.Db

  $dumpDir = "$RESTORE_DIR\qa\postgres\$name"
  $dump = Get-ChildItem $dumpDir -Filter "*.dump" | Sort-Object LastWriteTime -Descending | Select-Object -First 1

  if (-not $dump) {
    Write-Host "⚠️ No se encontró dump para $name, se omite"
    continue
  }

  Write-Host "🐘 Restaurando $name desde $($dump.Name)"

  docker cp "$($dump.FullName)" "${container}:/tmp/${name}.dump"

  docker exec -it $container pg_restore `
    -U $PG_USER `
    -d $db `
    --clean `
    --if-exists `
    --no-owner `
    --no-privileges `
    "/tmp/${name}.dump"

  Write-Host "✅ $name restaurado"
}

# =========================================
# PASO 3 — RESTORE MONGODB
# =========================================

$mongoDir = "$RESTORE_DIR\qa\mongo"
$mongoArchive = Get-ChildItem $mongoDir -Filter "*.archive" | Sort-Object LastWriteTime -Descending | Select-Object -First 1

if ($mongoArchive) {
  Write-Host "🍃 Restaurando MongoDB desde $($mongoArchive.Name)"

  docker cp "$($mongoArchive.FullName)" "${MONGO_CONTAINER}:/tmp/mongo.archive"

  docker exec -it $MONGO_CONTAINER mongorestore `
    --archive="/tmp/mongo.archive" `
    --gzip `
    --drop `
    --username $env:MONGO_USER `
    --password $env:MONGO_PASSWORD `
    --authenticationDatabase $MONGO_AUTH_DB

  Write-Host "✅ MongoDB restaurado"
} else {
  Write-Host "⚠️ No se encontró backup de MongoDB"
}

# =========================================
# PASO 4 — Levantar aplicación
# =========================================

Write-Host "▶️ Levantando aplicación completa..."
docker compose up -d | Out-Null

Write-Host "🎉 RESTORE COMPLETO FINALIZADO"
