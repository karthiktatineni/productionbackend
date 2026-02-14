# Use Node.js as the base image
FROM node:20-slim

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy the rest of the backend code
COPY . .

# Expose the port the app runs on
EXPOSE 5000

# Start the server
CMD ["node", "server.js"]
