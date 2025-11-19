# syntax=docker/dockerfile:1.6

FROM node:20-alpine AS base

WORKDIR /app

# Copy only dependency files first
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Now copy the rest of the project
COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev", "--", "--hostname", "0.0.0.0", "--port", "3000"]
