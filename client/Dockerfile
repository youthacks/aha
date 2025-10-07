FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Copy environment file for production build
COPY .env.production .env.production

# Build the application
RUN npm run build

# Install serve to run the production build
RUN npm install -g serve

# Expose the port
EXPOSE 3000

# Serve the built application with SPA routing support
CMD ["serve", "-s", "build", "-l", "3000", "-n"]
