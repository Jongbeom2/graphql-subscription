import * as ReactDOM from 'react-dom/client';
import { ApolloClient, InMemoryCache, ApolloProvider } from '@apollo/client';
import App from './App';

import { split, HttpLink } from '@apollo/client';
import { getMainDefinition } from '@apollo/client/utilities';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient } from 'graphql-ws';

// https://www.apollographql.com/docs/react/data/subscriptions/

const httpLink = new HttpLink({
  uri: 'http://localhost:4000',
});

const wsLink = new GraphQLWsLink(
  createClient({
    url: 'ws://localhost:4000',
  }),
);

// split 을 이용하여 요청에 따라 link를 나눔.
// link 는 클라이언트 -> 서버 -> 클라이언트 사이 데이터 흐름을 커스터마이즈하여 사용할 때 사용함.
// 대표적으로 서버에서 인증 오류가 발생했을 때 사용함.
const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === 'OperationDefinition' &&
      definition.operation === 'subscription'
    );
  },
  wsLink,
  httpLink,
);

const client = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache(),
});

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement,
);

root.render(
  <ApolloProvider client={client}>
    <App />
  </ApolloProvider>,
);
