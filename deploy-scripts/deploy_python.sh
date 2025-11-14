#!/bin/bash
set -e

APP_DIR="/home/ubuntu/apps/ezapi-miner"
# ensure dir exists
mkdir -p "$APP_DIR"
cd "$APP_DIR"

# stop app (if systemd exists)
sudo systemctl stop ezapi-miner.service || true

# extract new package if provided as zip/tar (workflow will copy files)
# If workflow uploads code in-place, just install deps:
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip setuptools wheel
if [ -f requirements.txt ]; then
  pip install -r requirements.txt
fi

# create a systemd unit to ensure service starts on boot
sudo tee /etc/systemd/system/ezapi-miner.service > /dev/null <<'EOF'
[Unit]
Description=ezapi-miner Python App
After=network.target

[Service]
User=ubuntu
WorkingDirectory=/home/ubuntu/apps/ezapi-miner
Environment=PYTHONUNBUFFERED=1
ExecStart=/home/ubuntu/apps/ezapi-miner/venv/bin/python3 app.py
Restart=always

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable ezapi-miner.service
sudo systemctl restart ezapi-miner.service

