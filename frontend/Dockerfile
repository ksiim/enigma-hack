# Stage 1: Build the React application with Vite
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the app's source code
COPY . .

# Build the app (Vite создает папку dist, а не build)
RUN npm run build

# Stage 2: Serve the app with Nginx
FROM nginx:alpine AS runner

# Копируем файлы из папки dist (ВАЖНО: для Vite это dist, не build)
COPY --from=builder /app/dist /usr/share/nginx/html

# Для поддержки клиентского роутинга (React Router)
# Создаем конфиг nginx на лету
RUN echo 'server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html; \
        try_files $uri /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]