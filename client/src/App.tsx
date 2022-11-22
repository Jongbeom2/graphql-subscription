import { gql, useMutation, useQuery, useSubscription } from '@apollo/client';
import { useRef, useState } from 'react';

function App() {
  // query
  const [chatList, setChatList] = useState<{ content: string }[]>([]);
  useQuery<{
    chatList: { content: string }[];
  }>(GET_CHAT_LIST, {
    onCompleted: (data) => {
      setChatList(data.chatList);
    },
  });
  // subscription
  useSubscription<{ chatCreated: { content: string } }>(ON_CHAT_CREATED, {
    onData: (data) => {
      if (data.data.data?.chatCreated.content) {
        setChatList([
          ...chatList,
          { content: data.data.data?.chatCreated.content },
        ]);
      }
    },
  });
  // mutation
  let inputRef = useRef<HTMLInputElement>(null);
  const [createChat] = useMutation<{ content: string }, { content: string }>(
    CREATE_CHAT,
  );
  return (
    <>
      <h1
        style={{
          margin: 20,
        }}
      >
        채팅앱
      </h1>
      {chatList.map((chat, idx) => (
        <div
          key={idx}
          style={{
            padding: 10,
            margin: 10,
            borderRadius: 5,
            width: 'fit-content',
            backgroundColor: '#dddddd',
          }}
        >
          <div>{chat.content}</div>
        </div>
      ))}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (inputRef.current?.value) {
            createChat({ variables: { content: inputRef.current.value } });
            inputRef.current.value = '';
          }
        }}
      >
        <input
          ref={inputRef}
          style={{
            marginLeft: 10,
            marginRight: 10,
            height: 25,
            padding: 5,
            borderRadius: 5,
            width: 500,
          }}
        />
        <button
          type='submit'
          style={{ height: 40, borderRadius: 5, padding: 5, width: 50 }}
        >
          전송
        </button>
      </form>
    </>
  );
}

export default App;

const GET_CHAT_LIST = gql`
  query GetChatList {
    chatList {
      content
    }
  }
`;

const ON_CHAT_CREATED = gql`
  subscription OnChatCreated {
    chatCreated {
      content
    }
  }
`;

const CREATE_CHAT = gql`
  mutation CreateChat($content: String!) {
    createChat(content: $content) {
      content
    }
  }
`;
