#!/bin/bash
set -e

APP_DIR="/home/ubuntu/apps/ezapi-codegen"
mkdir -p "$APP_DIR"
cd "$APP_DIR"

# stop previous service
sudo systemctl stop ezapi-codegen.service || true

# workflow should scp the jar into this directory as app.jar
if [ -f *.jar ]; then
  JARFILE=$(ls *.jar | head -n1)
  mv "$JARFILE" app.jar
fi

# create systemd service
sudo tee /etc/systemd/system/ezapi-codegen.service > /dev/null <<'EOF'
[Unit]
Description=ezapi-codegen Java App
After=network.target

[Service]
User=ubuntu
WorkingDirectory=/home/ubuntu/apps/ezapi-codegen
ExecStart=/usr/bin/java -jar /home/ubuntu/apps/ezapi-codegen/app.jar
Restart=always

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable ezapi-codegen.service
sudo systemctl restart ezapi-codegen.service

