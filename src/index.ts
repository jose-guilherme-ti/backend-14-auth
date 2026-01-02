import { createServer } from "http";
import { createYoga, createSchema, createPubSub } from "graphql-yoga";
import { useServer } from "graphql-ws/lib/use/ws";
import { WebSocketServer } from "ws";
import { PrismaClient } from "@prisma/client";
import typeDefs from "./schema";
import resolvers from "./resolvers";
import { getUserFromToken } from "./auth";

// 🔥 Apenas um PubSub global
const prisma = new PrismaClient();
const pubsub = createPubSub();

const schema = createSchema({
  typeDefs,
  resolvers,
});

// 🚀 Yoga HTTP + WS aware
const yoga = createYoga({
  schema,
  graphqlEndpoint: "/graphql",
  context: async ({ request }) => {
    // JWT no HTTP
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    const user = token ? getUserFromToken(token) : null;

    return { prisma, pubsub, user };
  },
});

const server = createServer(yoga);

// 📡 Servidor WebSocket separado
const wsServer = new WebSocketServer({
  server,
  path: yoga.graphqlEndpoint,
});

// 🔐 WS também recebe user + prisma + pubsub
useServer(
  {
    schema,
    context: async (ctx) => {
      // JWT no WebSocket (connectionParams)
      const token = ctx?.connectionParams?.Authorization?.replace("Bearer ", "");
      const user = token ? getUserFromToken(token) : null;

      return { prisma, pubsub, user };
    },
  },
  wsServer
);

server.listen(4000, () => {
  console.log("🚀 HTTP:        http://localhost:4000/graphql");
  console.log("📡 WebSocket:   ws://localhost:4000/graphql");
});
