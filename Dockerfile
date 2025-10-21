# Multi-stage Docker build for React + FastAPI application
# Stage 1: Build the React frontend
FROM node:18-alpine AS frontend-builder

# Set working directory for frontend build
WORKDIR /app/frontend

# Copy frontend source code
COPY frontend/ .

# Install frontend dependencies
RUN npm install

# Build the React application for production
# This creates an optimized dist/ folder with minified assets
RUN npm run build

# Stage 2: Setup Python backend and serve the built frontend
FROM python:3.10-slim AS backend

# Set working directory for the application
WORKDIR /app

# Copy Python requirements first (for better Docker layer caching)
COPY backend/requirements.txt ./

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source code
COPY backend/ ./

# Copy backend and built frontend
COPY backend/ ./backend/
COPY --from=frontend-builder /app/frontend/dist ./static
RUN ls ./static
# Expose port 8080 (Google Cloud Run standard)
EXPOSE 8080

# Start the FastAPI server
# --host 0.0.0.0 allows external connections (required for containers)
# --port 8080 matches Google Cloud Run expectations
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8080"] 
