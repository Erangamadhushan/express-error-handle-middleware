# Use Node LTS
FROM node:22-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build the package
RUN npm run build

# Default command (you can change this)
CMD ["npm", "test"]