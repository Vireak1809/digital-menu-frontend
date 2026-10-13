FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
RUN printf 'server {\n\
  listen 80;\n\
  root /usr/share/nginx/html;\n\
  index index.html;\n\
  location / { try_files $uri $uri/ /index.html; }\n\
  location /api { proxy_pass http://server:4000; proxy_set_header Host $host; }\n\
  location /uploads { proxy_pass http://server:4000; }\n\
  location /socket.io { proxy_pass http://server:4000; proxy_http_version 1.1; proxy_set_header Upgrade $http_upgrade; proxy_set_header Connection "upgrade"; }\n\
}\n' > /etc/nginx/conf.d/default.conf
EXPOSE 80