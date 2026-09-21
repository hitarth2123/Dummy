const loginAndTest = async () => {
  try {
    const loginRes = await fetch('https://aibuddy-2.onrender.com/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ devEmail: 'student@seed.dev', devPassword: 'Student@12345' })
    });
    
    const text = await loginRes.text();
    let loginData;
    try {
      loginData = JSON.parse(text);
    } catch(e) {
      console.log("Login failed to parse JSON. Raw body:", text);
      return;
    }

    if (!loginData.success) {
      console.log("Login failed", loginData);
      return;
    }

    const token = loginData.data.accessToken;
    const chatRes = await fetch('https://aibuddy-2.onrender.com/api/llm/tutor/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ message: "Hello", stream: false })
    });
    
    console.log("Chat Status:", chatRes.status);
    const chatText = await chatRes.text();
    console.log("Chat Body:", chatText);

  } catch (err) {
    console.error("Script error:", err);
  }
};
loginAndTest();
