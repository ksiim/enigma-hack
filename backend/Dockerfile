# Сборка зависимостей
FROM python:3.12-slim AS builder
WORKDIR /app

COPY --from=ghcr.io/astral-sh/uv:0.4.15 /uv /bin/uv

ENV PATH="/app/.venv/bin:$PATH"
ENV UV_COMPILE_BYTECODE=1
ENV UV_LINK_MODE=copy

# Копируем только файлы зависимостей
COPY backend/pyproject.toml backend/uv.lock ./
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --no-install-project

# Копируем код приложения
COPY ./Makefile /app/Makefile
COPY backend/src/app /app/backend/src/app
COPY backend/src/migrations /app/src/migrations
COPY .env /app/

# Миграции
FROM python:3.12-slim AS migrations
WORKDIR /app
RUN apt-get update && apt-get install -y curl make && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/.venv /app/.venv
COPY --from=builder /app/backend /app/backend
COPY --from=builder /app/src/migrations /app/src/migrations
COPY --from=builder /app/.env /app/.env
COPY backend/alembic.ini /app/src/alembic.ini

ENV PATH="/app/.venv/bin:$PATH"
ENV PYTHONPATH="/app:/app/backend"
ENV ALEMBIC_CONFIG=/app/src/alembic.ini
CMD ["alembic", "upgrade", "head"]

# Development
FROM python:3.12-slim AS dev
WORKDIR /app
RUN apt-get update && apt-get install -y curl make && rm -rf /var/lib/apt/lists/*

COPY --from=ghcr.io/astral-sh/uv:0.4.15 /uv /usr/local/bin/uv
COPY --from=builder /app/.venv /app/.venv
COPY --from=builder /app/backend /app/backend
COPY --from=builder /app/Makefile /app/Makefile
COPY --from=builder /app/src/migrations /app/migrations
COPY --from=builder /app/.env /app/.env

ENV PATH="/app/.venv/bin:$PATH"
ENV PYTHONPATH="/app:/app/backend"
ENV ALEMBIC_CONFIG=/app/alembic.ini
CMD ["make dev-run"]

# Production
FROM python:3.12-slim AS prod
WORKDIR /app

RUN apt-get update && apt-get install -y curl make && rm -rf /var/lib/apt/lists/*
COPY --from=ghcr.io/astral-sh/uv:0.4.15 /uv /usr/local/bin/uv
COPY --from=builder /app/.venv /app/.venv
COPY --from=builder /app/backend /app/backend
COPY --from=builder /app/Makefile /app/Makefile
COPY --from=builder /app/.env /app/.env

ENV PATH="/app/.venv/bin:$PATH"
ENV PYTHONPATH="/app:/app/backend"
ENV ALEMBIC_CONFIG=/app/alembic.ini
CMD ["make prod-run"]