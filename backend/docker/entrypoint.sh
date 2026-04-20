#!/bin/sh
set -e

echo "Waiting for database..."
while ! python -c "
import sys, os, environ
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
env = environ.Env()
env.read_env('/app/.env', overwrite=False)
db_url = os.environ.get('DATABASE_URL', '')
if 'sqlite' in db_url:
    sys.exit(0)
import socket
from urllib.parse import urlparse
parsed = urlparse(db_url)
host = parsed.hostname or 'localhost'
port = parsed.port or 5432
sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
sock.settimeout(2)
result = sock.connect_ex((host, port))
sock.close()
sys.exit(result)
" 2>/dev/null; do
    echo "Database unavailable — sleeping 1s"
    sleep 1
done
echo "Database is ready!"

echo "Applying migrations..."
python manage.py migrate --noinput

echo "Compiling translation catalogs..."
python manage.py compilemessages

echo "Collecting static files..."
python manage.py collectstatic --noinput 2>/dev/null || true

echo "Starting: $@"
exec "$@"
