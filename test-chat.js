import { io } from 'socket.io-client';

const socketUrl = 'http://localhost:3001';


const client1 = io(socketUrl, { reconnection: true });
const client2 = io(socketUrl, { reconnection: true });

const userId1 = 'test-user-1';
const userId2 = 'test-user-2';

console.log('🚀 Starting chat test...\n');

client1.on('connect', () => {
  console.log(`✅ Client 1 connected (socket: ${client1.id})`);
  
  
  client1.emit('register', { 
    userId: userId1,
    following: [],
    followers: []
  });
  console.log(`📝 Registered user: ${userId1}`);
});

client1.on('conversations:init', (data) => {
  console.log(`💬 Client 1 - Conversations initialized:`, data);
});

client1.on('message:confirmation', (data) => {
  console.log(`✅ Client 1 - Message confirmed:`, data);
});

client1.on('conversation:update', (thread) => {
  console.log(`🔄 Client 1 - Conversation updated:`, {
    id: thread.id,
    messages: thread.messages.length,
    lastMessage: thread.lastMessage
  });
});

client1.on('error:validation', (error) => {
  console.error(`❌ Client 1 - Validation error:`, error);
});


client2.on('connect', () => {
  console.log(`✅ Client 2 connected (socket: ${client2.id})`);
  
  
  client2.emit('register', { 
    userId: userId2,
    following: [],
    followers: []
  });
  console.log(`📝 Registered user: ${userId2}`);
});

client2.on('conversations:init', (data) => {
  console.log(`💬 Client 2 - Conversations initialized:`, data);
});

client2.on('message:confirmation', (data) => {
  console.log(`✅ Client 2 - Message confirmed:`, data);
});

client2.on('conversation:update', (thread) => {
  console.log(`🔄 Client 2 - Conversation updated:`, {
    id: thread.id,
    messages: thread.messages.length,
    lastMessage: thread.lastMessage
  });
});

client2.on('error:validation', (error) => {
  console.error(`❌ Client 2 - Validation error:`, error);
});


setTimeout(() => {
  console.log('\n📤 Sending test message from client 1 to client 2...\n');
  client1.emit('message:send', {
    from: userId1,
    to: userId2,
    text: 'Hello from test user 1! Is this working?'
  });
}, 2000);


setTimeout(() => {
  console.log('\n📤 Sending reply from client 2 to client 1...\n');
  client2.emit('message:send', {
    from: userId2,
    to: userId1,
    text: 'Hi! Yes, the chat is working!'
  });
}, 4000);


setTimeout(() => {
  console.log('\n🔌 Disconnecting clients...\n');
  client1.disconnect();
  client2.disconnect();
  process.exit(0);
}, 6000);
