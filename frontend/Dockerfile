# Frontend Dockerfile for HR AI Platform
# Multi-stage build: Build React app and serve with optimized Nginx

# Stage 1: Build the application
FROM node:22-alpine AS builder

# Set work directory
WORKDIR /workspace/frontend

# Install dependencies
COPY frontend/package*.json ./
RUN npm install

# Copy source code
COPY frontend/ ./

# Build application with production optimizations
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine

# Install wget for healthcheck
RUN apk add --no-cache wget

# Copy built files from builder stage
COPY --from=builder /workspace/frontend/dist /usr/share/nginx/html

# Copy optimized nginx configuration
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Create log directory
RUN mkdir -p /var/log/nginx && touch /var/log/nginx/frontend-access.log /var/log/nginx/frontend-error.log

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --quiet --tries=1 -O - http://localhost/health || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
