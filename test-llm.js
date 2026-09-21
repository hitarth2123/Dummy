require('dotenv').config({ path: 'server/.env' });
const { chat } = require('./server/src/services/llm.service');

(async () => {
  try {
    const res = await chat("Hello", { provider: 'groq' });
    console.log("Success:", res);
  } catch(e) {
    console.error("Error:", e);
  }
})();
