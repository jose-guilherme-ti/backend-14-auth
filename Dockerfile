FROM node:20

WORKDIR /app

# Dependências necessárias (openssl p/ Prisma no Node 20)
RUN apt-get update && apt-get install -y openssl && apt-get clean

# Copia package.json antes p/ cache
COPY package*.json ./

# Instala dependências
RUN npm install

# Copia resto do projeto
COPY . .

# Gera Prisma Client
RUN npx prisma generate

EXPOSE 4000

# Executa migrations e sobe o servidor
CMD npx prisma migrate deploy && npm run dev
