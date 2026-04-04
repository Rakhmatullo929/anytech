# =============================================================================
# Stage 1: Base — system-level dependencies shared by all targets
# =============================================================================
FROM python:3.12-slim AS base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        build-essential \
        libpq-dev \
        gettext \
        curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# =============================================================================
# Stage 2: Dependencies — install Python packages
# =============================================================================
FROM base AS deps

ARG BUILD_ENV=production

COPY requirements/ requirements/
RUN pip install --no-cache-dir -r requirements/${BUILD_ENV}.txt

# =============================================================================
# Stage 3: Application
# =============================================================================
FROM python:3.12-slim AS app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        libpq-dev \
        curl \
    && rm -rf /var/lib/apt/lists/*

RUN addgroup --system django \
    && adduser --system --ingroup django django

COPY --from=deps /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY --from=deps /usr/local/bin /usr/local/bin

WORKDIR /app

COPY --chown=django:django . .

RUN mkdir -p staticfiles media static templates apps \
    && chown -R django:django staticfiles media

RUN chmod +x docker/entrypoint.sh

USER django

EXPOSE 8000

ENTRYPOINT ["docker/entrypoint.sh"]
CMD ["gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "4"]
