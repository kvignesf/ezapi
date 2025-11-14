#!/bin/bash
set -e

APP_DIR="/var/www/ezapi-ui"
sudo mkdir -p "$APP_DIR"
sudo chown -R ubuntu:ubuntu "$APP_DIR"
cd "$APP_DIR"

# remove old files and copy new build files (workflow will scp them)
# If workflow put files into /home/ubuntu/apps/static_build, move them:
if [ -d /home/ubuntu/static_build ]; then
  rm -rf "$APP_DIR"/*
  mv /home/ubuntu/static_build/* "$APP_DIR"/
fi

# configure nginx site
sudo tee /etc/nginx/sites-available/ezapi-ui > /dev/null <<'EOF'
server {
    listen 80;
    server_name _;

    root /var/www/ezapi-ui;
    index index.html;

    location / {
        try_files \$uri /index.html;
    }

    # proxy API / socket if needed:
    # location /api/ { proxy_pass http://127.0.0.1:8080; }
}
EOF

sudo ln -sf /etc/nginx/sites-available/ezapi-ui /etc/nginx/sites-enabled/ezapi-ui
sudo nginx -t
sudo systemctl restart nginx

