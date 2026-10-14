FROM debian:bookworm-slim

# Avoid prompts during installation
ENV DEBIAN_FRONTEND=noninteractive

# Install Node.js, npm, and certificates directly on Debian
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
      nodejs \
      npm \
      ca-certificates && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install --only=production

COPY . .

EXPOSE 3000
CMD ["node", "server.js"]