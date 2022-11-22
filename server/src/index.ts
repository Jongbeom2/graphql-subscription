import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { createServer } from 'http';
import express from 'express';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/lib/use/ws';
import bodyParser from 'body-parser';
import cors from 'cors';
import { PubSub } from 'graphql-subscriptions';

// https://www.apollographql.com/docs/apollo-server/data/subscriptions/

const pubsub = new PubSub();

const typeDefs = `
  type Chat {
    content: String
  }
  type Query {
    chatList: [Chat!]!
  }
  type Mutation{
    createChat(content: String!): Chat!
  }
  type Subscription {
    chatCreated: Chat!
  }
`;

const chatList = [
  {
    content: 'The Awakening',
  },
  {
    content: 'City of Glass',
  },
];

const resolvers = {
  Query: {
    chatList: () => chatList,
  },
  Mutation: {
    createChat(parent, args, context) {
      chatList.push({
        content: args.content,
      });
      pubsub.publish('CHAT_CREATED', {
        chatCreated: {
          content: args.content,
        },
      });
      return {
        content: args.content,
      };
    },
  },
  Subscription: {
    chatCreated: {
      subscribe: () => pubsub.asyncIterator(['CHAT_CREATED']),
    },
  },
};

const schema = makeExecutableSchema({ typeDefs, resolvers });

const app = express();
const httpServer = createServer(app);
const wsServer = new WebSocketServer({
  server: httpServer,
  path: '/',
});

const serverCleanup = useServer({ schema }, wsServer);

const server = new ApolloServer({
  schema,
  plugins: [
    ApolloServerPluginDrainHttpServer({ httpServer }),
    {
      async serverWillStart() {
        return {
          async drainServer() {
            await serverCleanup.dispose();
          },
        };
      },
    },
  ],
});

await server.start();
app.use(
  '/',
  cors<cors.CorsRequest>(),
  bodyParser.json(),
  expressMiddleware(server),
);

const PORT = 4000;
httpServer.listen(PORT, () => {
  console.log(`Server is now running on http://localhost:${PORT}/graphql`);
});
