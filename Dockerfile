FROM node:20-alpine

# Install dependencies for native modules
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    ffmpeg \
    git

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --omit=dev --legacy-peer-deps

# Copy app source
COPY . .

# Create necessary directories
RUN mkdir -p auth_info tmp

# Expose port (if web server is added later)
EXPOSE 3000

# Start the bot
CMD ["npm", "start"]
