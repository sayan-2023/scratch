# ==============================================================================
# Multi-Stage Production Dockerfile for AI Request Triage Assistant
# Combines React + Vite Frontend & FastAPI + LangGraph Backend into One Service
# Compatible with Render (Free Tier), Koyeb, Hugging Face Spaces, Railway, Fly.io
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Build React + Vite Frontend Assets
# ------------------------------------------------------------------------------
FROM node:20-slim AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm install

COPY frontend/ ./
RUN npm run build

# ------------------------------------------------------------------------------
# Stage 2: Production Python Backend & Unified Static Serving
# ------------------------------------------------------------------------------
FROM python:3.11-slim

WORKDIR /app

# Install minimal OS utilities
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python requirements
COPY backend/requirements.txt ./backend/requirements.txt
RUN pip install --no-cache-dir -r ./backend/requirements.txt

# Copy backend source code and operational knowledge base
COPY backend/ ./backend/
COPY RAG_KNOWLEDGE_BASE.md ./

# Copy built frontend assets from Stage 1 into the frontend/dist directory
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Ensure data directory exists for user state and configurations
RUN mkdir -p /app/backend/data

# Environment configuration
ENV PORT=8000
ENV PYTHONPATH=/app/backend
ENV PYTHONUNBUFFERED=1

EXPOSE 8000

# Start FastAPI with uvicorn listening on the cloud provider's assigned $PORT
CMD ["sh", "-c", "python -m uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
