# Stage 1: Build React
FROM node:18-alpine as builder

WORKDIR /app

# Copy package.json & install dependencies
COPY package.json package-lock.json ./
RUN npm install

# Copy source code & build
COPY . .
RUN npm run build

# Stage 2: Serve dengan Nginx
FROM nginx:alpine

# Copy hasil build dari Stage 1 ke folder Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy konfigurasi Nginx custom (Opsional, agar React Router aman saat refresh)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]