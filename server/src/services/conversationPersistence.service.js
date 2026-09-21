const crypto = require('crypto');
const fs = require('fs/promises');
const path = require('path');

const conversationPath = path.resolve(__dirname, '../dataset/tutorConversations.json');
const conversationDirectory = path.dirname(conversationPath);
let writeQueue = Promise.resolve();

const saveConversationTurn = async ({ conversationId, userId, title, topic, subtopic, question, answer }) => {
  const id = String(conversationId || crypto.randomUUID());
  let result;
  writeQueue = writeQueue.then(async () => {
    await fs.mkdir(conversationDirectory, { recursive: true });
    let conversations = [];
    try {
      conversations = JSON.parse(await fs.readFile(conversationPath, 'utf8'));
    } catch {
      conversations = [];
    }
    let conversation = conversations.find((item) => item.conversation_id === id);
    if (!conversation) {
      conversation = {
        conversation_id: id,
        user_id: String(userId || ''),
        title,
        topic,
        subtopic,
        sequence: conversations.length + 1,
        messages: [],
        created_at: new Date().toISOString(),
      };
      conversations.push(conversation);
    }
    conversation.title = conversation.title || title;
    conversation.topic = topic || conversation.topic;
    conversation.subtopic = subtopic || conversation.subtopic;
    const nextSequence = conversation.messages.length + 1;
    conversation.messages.push(
      { sequence: nextSequence, role: 'user', content: question, created_at: new Date().toISOString() },
      { sequence: nextSequence + 1, role: 'assistant', content: answer, created_at: new Date().toISOString() }
    );
    conversation.updated_at = new Date().toISOString();
    conversations.sort((left, right) => left.sequence - right.sequence);
    await fs.writeFile(conversationPath, `${JSON.stringify(conversations, null, 2)}\n`, 'utf8');
    result = { conversationId: id, sequence: conversation.sequence, messageSequence: nextSequence };
  });
  await writeQueue;
  return result;
};

module.exports = { saveConversationTurn, conversationPath };
