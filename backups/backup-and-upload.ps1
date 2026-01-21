# ============================
# GENERAL SETTINGS
# ============================

$PROJECT_ROOT = Get-Location
$BACKUP_DIR = "$PROJECT_ROOT\backups"
$POSTGRES_DIR = "$BACKUP_DIR\postgres"
$MONGO_DIR = "$BACKUP_DIR\mongo"
$DATE = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"

mkdir $POSTGRES_DIR -Force | Out-Null
mkdir $MONGO_DIR -Force | Out-Null

# ============================
# POSTGRES
# ============================
$PG_USER = "admin"

$postgresTargets = @(
  @{ Name="classroom_db"; Container="classroom_db_container"; Db="classroom_db" },
  @{ Name="users_db";     Container="users_db_container";     Db="users_db"     },
  @{ Name="booking_db";   Container="booking_db_container";   Db="booking_db"   }
)

Write-Host "=== Iniciando backup de PostgreSQL ==="

foreach ($t in $postgresTargets) {
  $name = $t.Name
  $container = $t.Container
  $db = $t.Db

  $outDir = "$POSTGRES_DIR\$name"
  mkdir $outDir -Force | Out-Null

  Write-Host "🐘 Backup Postgres: $name ($container / $db)"

  docker exec $container pg_dump `
    -U $PG_USER `
    -F c `
    -d $db `
    -f "/tmp/$name.dump"

  $outFile = "$outDir\$name`_$DATE.dump"
  docker cp "${container}:/tmp/$name.dump" $outFile

  Write-Host "✅ Generado: $outFile"
}

# ============================
# MONGO
# ============================
$MONGO_CONTAINER = "mongodb_container"
$MONGO_DB = "claresys"

if ($env:MONGO_USER -and $env:MONGO_PASSWORD) {
  $mongoOutDir = "$MONGO_DIR\$MONGO_DB"
  mkdir $mongoOutDir -Force | Out-Null

  Write-Host "🍃 Backup MongoDB: $MONGO_DB"

  docker exec $MONGO_CONTAINER mongodump `
    --username $env:MONGO_USER `
    --password $env:MONGO_PASSWORD `
    --authenticationDatabase admin `
    --db $MONGO_DB `
    --archive="/tmp/$MONGO_DB.archive" `
    --gzip

  $mongoFile = "$mongoOutDir\$MONGO_DB`_$DATE.archive"
  docker cp "${MONGO_CONTAINER}:/tmp/$MONGO_DB.archive" $mongoFile

  Write-Host "✅ Generado: $mongoFile"
} else {
  Write-Host "⚠️ Saltando MongoDB: faltan MONGO_USER/MONGO_PASSWORD en variables de entorno."
}

# ============================
# SUBIR AL SERVIDOR ON-PREMISE (QA)
# ============================

$REMOTE_USER = "distribuida"
$REMOTE_HOST = "server.distribuidauce.org"
$REMOTE_PATH = "~/Documents/distribuida1/Ramses_Riofrio/qa"
$SSH_PROXY   = "cloudflared access ssh --hostname server.distribuidauce.org"

Write-Host "☁️ Asegurando estructura remota..."
ssh -o "ProxyCommand=$SSH_PROXY" `
  "${REMOTE_USER}@${REMOTE_HOST}" `
  "mkdir -p ~/Documents/distribuida1/Ramses_Riofrio/qa/postgres/{booking_db,classroom_db,users_db} ~/Documents/distribuida1/Ramses_Riofrio/qa/mongo"

Write-Host "☁️ Subiendo backups al servidor..."
scp -r `
  -o "ProxyCommand=$SSH_PROXY" `
  "$BACKUP_DIR\postgres" `
  "$BACKUP_DIR\mongo" `
  "${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_PATH}"

Write-Host "✅ Upload completado"
