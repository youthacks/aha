FROM node:20-alpine

# Accept build argument for API URL
ARG REACT_APP_API_URL=http://api.aha.youthacks.duckdns.org

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build the application with environment variable
ENV REACT_APP_API_URL=$REACT_APP_API_URL
RUN npm run build

# Install serve to run the production build
RUN npm install -g serve

# Expose the port
EXPOSE 3000

# Serve the built application with SPA routing support
CMD ["serve", "-s", "build", "-l", "3000", "-n"]
