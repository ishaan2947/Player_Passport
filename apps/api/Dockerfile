FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
# Cache bust argument - change this value to force rebuild
ARG CACHEBUST=1
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt && \
    python -c "import alembic; print(f'Alembic version: {alembic.__version__}')"

# Copy application code
COPY . .

# Make start script executable
RUN chmod +x scripts/start.sh

# Set Python path - use /app/src to avoid conflict with /app/alembic migrations folder
ENV PYTHONPATH=/app/src
ENV PYTHONUNBUFFERED=1

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Run the application with migrations
CMD ["./scripts/start.sh"]

