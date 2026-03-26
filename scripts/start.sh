#!/usr/bin/env bash
# Tyda - robust startskript (Unix/macOS)
# Kor fran projektroten: ./scripts/start.sh

set -euo pipefail
BACKEND_PORT=8000
FRONTEND_PORT=5173
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BACKEND_DIR="$ROOT/backend"
FRONTEND_DIR="$ROOT/frontend"
BACKEND_ENV="$BACKEND_DIR/.env"
BACKEND_ENV_EXAMPLE="$BACKEND_DIR/.env.example"
REQUIREMENTS_FILE="$BACKEND_DIR/requirements.txt"
REFLEKTIONSARKIV_SQL="$ROOT/reflektionsarkiv.sql"
VENV_DIR="$BACKEND_DIR/venv"
VENV_PYTHON="$VENV_DIR/bin/python"
BACKEND_DEPS_MARKER="$VENV_DIR/.requirements.sha256"
FRONTEND_DEPS_MARKER="$FRONTEND_DIR/node_modules/.package-lock.sha256"

echo ""
echo "=== Tyda - Start ==="
echo ""

fail() {
    echo ""
    echo "FEL: $1"
    if [ -f "$ROOT/KOMPANJON.md" ]; then
        echo "Las vidare i KOMPANJON.md i projektroten."
    fi
    exit 1
}

find_python() {
    if command -v python3 >/dev/null 2>&1; then
        echo "python3"
        return
    fi
    if command -v python >/dev/null 2>&1; then
        echo "python"
        return
    fi
    fail "Hittar inte Python. Installera Python 3.11+ och kor igen."
}

ensure_backend_env() {
    if [ ! -f "$BACKEND_ENV" ]; then
        cp "$BACKEND_ENV_EXAMPLE" "$BACKEND_ENV"
        echo "[Backend] Skapade .env fran .env.example"
    fi
}

read_env_value() {
    local key="$1"
    local default_value="$2"
    if [ ! -f "$BACKEND_ENV" ]; then
        echo "$default_value"
        return
    fi
    local line
    line=$(grep -E "^${key}=" "$BACKEND_ENV" | tail -n 1 || true)
    if [ -z "$line" ]; then
        echo "$default_value"
        return
    fi
    local value="${line#*=}"
    if [ -z "$value" ]; then
        echo "$default_value"
    else
        echo "$value"
    fi
}

hash_file() {
    local file="$1"
    if command -v sha256sum >/dev/null 2>&1; then
        sha256sum "$file" | awk '{print $1}'
        return
    fi
    if command -v shasum >/dev/null 2>&1; then
        shasum -a 256 "$file" | awk '{print $1}'
        return
    fi
    fail "Hittar varken sha256sum eller shasum."
}

ensure_backend_venv() {
    local bootstrap_python
    bootstrap_python="$(find_python)"
    if [ ! -f "$VENV_PYTHON" ]; then
        echo "[Backend] Skapar virtuell miljo..."
        (cd "$BACKEND_DIR" && "$bootstrap_python" -m venv venv)
    fi

    local requirements_hash
    requirements_hash="$(hash_file "$REQUIREMENTS_FILE")"
    local installed_hash=""
    if [ -f "$BACKEND_DEPS_MARKER" ]; then
        installed_hash="$(cat "$BACKEND_DEPS_MARKER")"
    fi
    if [ "$requirements_hash" != "$installed_hash" ]; then
        echo "[Backend] Installerar Python-paket..."
        (cd "$BACKEND_DIR" && "$VENV_PYTHON" -m pip install -r requirements.txt)
        printf "%s" "$requirements_hash" > "$BACKEND_DEPS_MARKER"
    fi
}

ensure_frontend_deps() {
    if ! command -v npm >/dev/null 2>&1; then
        fail "Hittar inte npm. Installera Node.js 20+ och kor igen."
    fi
    local package_lock_hash
    package_lock_hash="$(hash_file "$FRONTEND_DIR/package-lock.json")"
    local installed_hash=""
    if [ -f "$FRONTEND_DEPS_MARKER" ]; then
        installed_hash="$(cat "$FRONTEND_DEPS_MARKER")"
    fi
    if [ ! -d "$FRONTEND_DIR/node_modules" ] || [ "$package_lock_hash" != "$installed_hash" ]; then
        echo "[Frontend] Installerar npm-paket..."
        (cd "$FRONTEND_DIR" && npm install)
        printf "%s" "$package_lock_hash" > "$FRONTEND_DEPS_MARKER"
    fi
}

ensure_database_ready() {
    if ! command -v mysql >/dev/null 2>&1; then
        echo "[Databas] mysql-klienten hittades inte. Hoppar over automatisk import."
        return
    fi

    local db_host db_port db_name db_user db_password
    db_host="$(read_env_value DB_HOST localhost)"
    db_port="$(read_env_value DB_PORT 3306)"
    db_name="$(read_env_value DB_NAME reflektionsarkiv)"
    db_user="$(read_env_value DB_USER root)"
    db_password="$(read_env_value DB_PASSWORD "")"

    local mysql_args=(--protocol=TCP "--host=$db_host" "--port=$db_port" "--user=$db_user")
    local old_mysql_pwd="${MYSQL_PWD-}"
    if [ -n "$db_password" ]; then
        export MYSQL_PWD="$db_password"
    else
        unset MYSQL_PWD || true
    fi

    local db_exists
    if ! db_exists="$(mysql "${mysql_args[@]}" --batch --skip-column-names -e "SHOW DATABASES LIKE '$db_name';" 2>/dev/null)"; then
        echo "[Databas] Kunde inte ansluta med mysql-klienten (vanligt pa Linux om root anvander auth_socket)."
        echo "         Atgard: importera manuellt med privilegierad anvandare, t.ex.:"
        echo "           sudo mysql < $REFLEKTIONSARKIV_SQL"
        echo "         Skapa sedan en anvandare med losenord for Tyda (se database/scripts/grants.sql och docs/DATABASE_SAKERHET.md)"
        echo "         och satt DB_USER/DB_PASSWORD i backend/.env. Fortsatter; backend ger fel om DB saknas."
    else
        if [ "$(printf "%s" "$db_exists" | tr -d '\r\n')" != "$db_name" ]; then
            echo "[Databas] Skapar databasen fran reflektionsarkiv.sql..."
            mysql "${mysql_args[@]}" < "$REFLEKTIONSARKIV_SQL" || fail "Automatisk import av reflektionsarkiv.sql misslyckades."
        fi
    fi

    if [ -n "$old_mysql_pwd" ]; then
        export MYSQL_PWD="$old_mysql_pwd"
    else
        unset MYSQL_PWD || true
    fi
}

kill_port() {
    local port="$1"
    local pids=""
    if command -v lsof >/dev/null 2>&1; then
        pids="$(lsof -ti ":$port" 2>/dev/null || true)"
    fi
    if [ -n "$pids" ]; then
        echo "[Port $port] Stoppar process(er): $pids"
        echo "$pids" | xargs kill -9 2>/dev/null || true
        sleep 2
    else
        echo "[Port $port] Ledig"
    fi
}

wait_for_http() {
    local url="$1"
    for _ in $(seq 1 30); do
        if curl -fsS "$url" >/dev/null 2>&1; then
            return 0
        fi
        sleep 0.5
    done
    return 1
}

ensure_backend_env
ensure_backend_venv
ensure_frontend_deps
ensure_database_ready

kill_port "$BACKEND_PORT"
kill_port "$FRONTEND_PORT"
echo ""

echo "[Backend] Startar uvicorn pa port $BACKEND_PORT..."
cd "$BACKEND_DIR"
# 0.0.0.0: nåbar via Tailscale/LAN (inte bara localhost)
"$VENV_PYTHON" -m uvicorn app.main:app --host 0.0.0.0 --port "$BACKEND_PORT" &
BACKEND_PID=$!
echo "[Backend] PID $BACKEND_PID"

if ! wait_for_http "http://127.0.0.1:$BACKEND_PORT/api/health"; then
    kill -9 "$BACKEND_PID" 2>/dev/null || true
    fail "Backend svarar inte pa /api/health."
fi

if ! curl -fsS "http://127.0.0.1:$BACKEND_PORT/api/db-health" >/dev/null 2>&1; then
    kill -9 "$BACKEND_PID" 2>/dev/null || true
    fail "Backend nar databasen inte. Kontrollera backend/.env och att MySQL kor."
fi

echo ""
echo "[Frontend] Startar Vite pa port $FRONTEND_PORT..."
echo ""
echo "  Backend:  http://127.0.0.1:$BACKEND_PORT"
echo "  Frontend: http://localhost:$FRONTEND_PORT"
ts_ip=""
if command -v tailscale >/dev/null 2>&1; then
    ts_ip="$(tailscale ip -4 2>/dev/null | head -n 1 | tr -d '\r\n' || true)"
fi
if [ -n "$ts_ip" ]; then
    echo "  (Tailscale IPv4) Backend:  http://${ts_ip}:$BACKEND_PORT"
    echo "  (Tailscale IPv4) Frontend: http://${ts_ip}:$FRONTEND_PORT"
fi
echo ""
echo "  Tryck Ctrl+C for att stoppa frontend. Backend (PID $BACKEND_PID) fortsatter kora."
echo ""

cd "$FRONTEND_DIR"
exec npm run dev
