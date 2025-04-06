# Use Node.js LTS as base image
FROM node:18-alpine

# Create app directory
WORKDIR /app

# Install app dependencies
COPY package*.json ./
RUN npm install --production

# Copy app source code
COPY . .

# Expose the API port
EXPOSE 4000

# Start the server
CMD ["node", "src/server.js"]
