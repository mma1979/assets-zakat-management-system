FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json ./
COPY package-lock.json* pnpm-lock.yaml* yarn.lock* ./
RUN npm ci
COPY . .

RUN npm run build

FROM nginx:1.27-alpine AS runner
RUN apk add --no-cache bash gettext

# Default value, can be overridden
ENV API_ORIGIN=http://api:8080

COPY --from=builder /app/dist /usr/share/nginx/html

# Create Nginx configuration template
RUN mkdir -p /etc/nginx/templates && \
    cat > /etc/nginx/templates/default.conf.template <<'EOF'
server {
  listen 80;
  server_name _;
  root /usr/share/nginx/html;
  index index.html;

  location / {
    try_files $uri $uri/ /index.html;
  }

  location /api/ {
    proxy_pass $API_ORIGIN;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
EOF

# Copy and setup entrypoint script
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 80

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
