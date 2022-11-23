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
    content: '안녕하세요!',
  },
  {
    content: 'Graphql Subscription 예제입니다.',
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

// schma 정의함.
// makeExecutableSchema 를 쓰는 이유는 useServer 가 해당 객체를 받기 때문임.
const schema = makeExecutableSchema({ typeDefs, resolvers });

// http 서버 생성함.
const app = express();
const httpServer = createServer(app);

// ws 서버 생성함.
const wsServer = new WebSocketServer({
  server: httpServer,
  path: '/',
});
const serverCleanup = useServer({ schema }, wsServer);

// Apollo 서버 생성함.
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

// expressMiddleware 을 사용하여 express 서버에 Apollo Server 를 붙임.
await server.start();

app.get('/hello', (req, res) => {
  res.send('Hello World!');
});

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
