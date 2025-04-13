#!/bin/sh

# Decode the CA cert from env and save to file
echo "$AIVEN_CA_CERT_B64" | base64 -d > /home/node/aiven-ca.pem

# Start n8n
exec "$@"
