# Use a lightweight Node.js image
FROM node:22-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json first to leverage Docker cache
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of your React frontend code
COPY . .

# Set the backend URL so the frontend knows where to fetch data
ENV VITE_API_URL=http://localhost:10000

# Expose Vite's default development port
EXPOSE 5173

# Run Vite with the --host flag so it exposes the server to Windows
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
