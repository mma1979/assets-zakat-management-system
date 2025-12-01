FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json ./
COPY package-lock.json* pnpm-lock.yaml* yarn.lock* ./
RUN npm install
COPY . .

ENV BACKEND_URL=http://backend
ENV API_KEY=AIzaSyA8r7JEC7YG3DfRcTKS3hqhOJkQuER5Hew
ENV RESEND_API_KEY=re_PPh1RPYd_FvHm69NoPpP1RFxuQo8q9YSG
ENV RESEND_SENDER="Invoice AI <noreply@wizeinvoice.com>"
ENV NOTIFICATION_EMAIL=mamado2000@gmail.com

RUN npm run build

FROM nginx:1.27-alpine AS runner
RUN apk add --no-cache bash gettext
ENV API_ORIGIN=http://api:8080
COPY --from=builder /app/dist /usr/share/nginx/html
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

EXPOSE 80
CMD ["/bin/sh","-c","envsubst '$API_ORIGIN' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
