FROM python:3.13-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

# Run as a non-root user.
RUN useradd --create-home --uid 10001 appuser
USER appuser

# Railway sets PORT at runtime. Set OPENAI_API_KEY and ALLOWED_ORIGINS as service variables.
ENV PORT=8000
EXPOSE 8000

# One worker only: chat sessions live in memory (see README "Before going live").
# --proxy-headers: read the real visitor IP from X-Forwarded-For, so the per-IP rate limit
# works behind Railway's proxy instead of counting every player as the same address.
CMD ["sh", "-c", "exec uvicorn main:app --host 0.0.0.0 --port ${PORT} --proxy-headers --forwarded-allow-ips='*'"]
