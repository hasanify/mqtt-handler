FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
COPY prisma /app/prisma
RUN npm install
COPY . .
RUN npm run tsc:build
CMD ["npm", "start"]