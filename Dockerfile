# One container, one origin (SDK model). Python serves the API and the built frontend;
# the Express domain engine runs alongside on 127.0.0.1 until it is ported (docs/TODO.md).
FROM node:22-slim AS web
WORKDIR /app
COPY package.json bun.lock* ./
RUN npm install
COPY . .
RUN npm run build

FROM python:3.12-slim
RUN apt-get update && apt-get install -y --no-install-recommends nodejs npm git && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY backend/pyproject.toml backend/pyproject.toml
RUN pip install --no-cache-dir -e "backend/[appext]"
COPY --from=web /app/node_modules node_modules
COPY --from=web /app/dist dist
COPY . .
ENV AUTH_MODE=appext APP_ENV=production STATIC_DIR=dist
EXPOSE 8100
CMD ["sh", "-c", "npx tsx server/legacy.ts & exec python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8100"]
