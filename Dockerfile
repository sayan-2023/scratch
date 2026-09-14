# ==============================================================================
# Multi-Stage Production Dockerfile for AI Request Triage Assistant (Root Context)
# ==============================================================================

# Stage 1: Build React Frontend
FROM node:20-slim AS frontend-builder
WORKDIR /app/frontend

COPY ai-request-triage-assistant/frontend/package*.json ./
RUN npm install

COPY ai-request-triage-assistant/frontend/ ./
RUN npm run build

# Stage 2: Python FastAPI Backend & Unified Static Serving
FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY ai-request-triage-assistant/backend/requirements.txt ./backend/requirements.txt
RUN pip install --no-cache-dir -r ./backend/requirements.txt

COPY ai-request-triage-assistant/backend/ ./backend/
COPY ai-request-triage-assistant/RAG_KNOWLEDGE_BASE.md ./

# Copy compiled frontend from Stage 1
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

RUN mkdir -p /app/backend/data

ENV PORT=8000
ENV PYTHONPATH=/app/backend
ENV PYTHONUNBUFFERED=1

EXPOSE 8000

CMD ["sh", "-c", "python -m uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]

