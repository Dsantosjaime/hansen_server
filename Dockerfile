# ---- build stage ----
    FROM node:20-alpine AS builder
    WORKDIR /app
    
    COPY package*.json ./
    RUN npm ci
    
    COPY . .
    
    ARG DATABASE_URL="mongodb://localhost:27017/dummy?replicaSet=rs0"
    ENV DATABASE_URL=$DATABASE_URL
    
    RUN npx prisma generate
    RUN npm run build
    
    # ---- runtime stage ----
    FROM node:20-alpine AS runner
    WORKDIR /app
    ENV NODE_ENV=production
    
    COPY package*.json ./
    RUN npm ci --omit=dev
    
    COPY --from=builder /app/node_modules/.prisma /app/node_modules/.prisma
    COPY --from=builder /app/node_modules/@prisma /app/node_modules/@prisma
    COPY --from=builder /app/prisma /app/prisma
    COPY --from=builder /app/dist /app/dist
    
    # IMPORTANT: Prisma client output custom
    COPY --from=builder /app/generated /app/generated
    # Robustesse si ton code compilé le cherche dans dist/generated/...
    COPY --from=builder /app/generated /app/dist/generated
    
    EXPOSE 3000
    CMD ["node", "dist/src/main.js"]