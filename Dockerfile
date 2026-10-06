# Base image: Node.js 20 on the small Alpine Linux
FROM node:20-alpine
# Working directory inside the container; later commands run here
WORKDIR /app
# Copy package.json (and package-lock.json if present) first, for faster rebuilds (layer caching)
COPY package*.json ./
# Install only the libraries needed to run the app (Express), not development tools
RUN npm install --omit=dev
# Copy the rest of the project (server.js and the public folder) into /app
COPY . .
# Document that the app listens on port 3000
EXPOSE 3000
# Every 30 s Docker calls /health; if it fails within 3 s the container is marked unhealthy
HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget -qO- http://localhost:3000/health || exit 1
# Command run when the container starts: "npm start" -> "node server.js"
CMD ["npm", "start"]