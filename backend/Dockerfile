FROM n8nio/n8n

# Copy the entrypoint script
COPY entrypoint.sh /entrypoint.sh

# Set the entrypoint (no chmod needed)
ENTRYPOINT ["/entrypoint.sh"]
CMD ["n8n"]

EXPOSE 5678
