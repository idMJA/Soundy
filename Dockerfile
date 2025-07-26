FROM oven/bun:latest

WORKDIR /app

COPY package.json bun.lock* ./

RUN bun install

COPY . .

CMD ["bun", "start"]