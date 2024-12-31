# Use the latest Node.js LTS version as the base image
FROM node:20-alpine

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy only the package.json and package-lock.json to install dependencies
COPY package*.json ./

# Install production dependencies
RUN npm install --production

# Copy only the main application file (index.js) into the container
COPY index.js .

# Expose the port the WebSocket server will run on
EXPOSE 8080

# Start the WebSocket server
CMD ["node", "index.js"]
