FROM node:24-alpine

# 必要なパッケージと日本語フォントをインストール
RUN apk add --no-cache \
    build-base \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    giflib-dev \
    librsvg-dev \
    font-noto-cjk

WORKDIR /bin
COPY package*.json ./
RUN npm ci
COPY . .
