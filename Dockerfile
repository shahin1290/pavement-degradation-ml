# Backend for Google Cloud Run
FROM python:3.13-slim

ENV PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1
WORKDIR /app

COPY requirements-cloudrun.txt .
RUN pip install -r requirements-cloudrun.txt

# Only what the API needs (see .dockerignore)
COPY backend ./backend
COPY ml ./ml
COPY artifacts/model.pkl ./artifacts/model.pkl

# Cloud Run sends the port in $PORT (8080 by default)
CMD exec uvicorn backend.app.main:app --host 0.0.0.0 --port ${PORT:-8080}
