FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install production dependencies
RUN npm install --production --ignore-scripts

# Copy source code
COPY src ./src
COPY server ./server

# Create volume for persistence
VOLUME /app/data

# Expose API port
EXPOSE 4000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=4000

# Start the server
CMD ["node", "server/index.js"]
