# syntax=docker/dockerfile:1.6

FROM node:20-alpine AS base

WORKDIR /app

# Install dependencies separately to leverage Docker layer caching.
COPY package.json package-lock.json ./
COPY vendor ./vendor
RUN npm ci

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev", "--", "--hostname", "0.0.0.0", "--port", "3000"]
