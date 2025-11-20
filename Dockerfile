# Dockerfile for GKMIT Node.js Backend

# 1. Builder Stage: Install dependencies and build assets
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package files first to leverage Docker layer caching
COPY package*.json ./
# Install dependencies
RUN npm install

# Copy application source code
COPY . .
# --- FIX: REMOVE TESTING PROCESS ---
# The 'npm run test' command is REMOVED from the Docker build process here.
# --- END FIX ---

# 2. Production Stage: Create a minimal image for running the app
FROM node:20-alpine AS production
WORKDIR /app

# Copy only production dependencies from the builder stage
COPY --from=builder /app/node_modules ./node_modules
# Copy only the necessary application code (source, server entry, etc.)
COPY --from=builder /app/src ./src
COPY --from=builder /app/*.js ./
COPY --from=builder /app/package.json .

# Expose the port (your Express app listens on 5000 or 8000/3000, adjust as necessary)
EXPOSE 8000

# Set Node environment to production
ENV NODE_ENV=production
# Define the command to run the application
CMD [ "node", "src/server.js" ]