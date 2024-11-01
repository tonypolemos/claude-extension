document.addEventListener('DOMContentLoaded', function() {
  const chatContainer = document.getElementById('chat-container');
  const messageInput = document.getElementById('message-input');
  const sendButton = document.getElementById('send-button');
  
  let isWaitingForResponse = false;

  function appendMessage(content, isUser) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user-message' : 'assistant-message'}`;
    messageDiv.textContent = content;
    chatContainer.appendChild(messageDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }

  async function sendMessage() {
    const message = messageInput.value.trim();
    if (!message || isWaitingForResponse) return;

    isWaitingForResponse = true;
    sendButton.disabled = true;
    messageInput.value = '';
    appendMessage(message, true);

    try {
      const response = await fetch('https://claude-extension.vercel.app/api/claude', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: "claude-3-opus-20240229",
          max_tokens: 1024,
          temperature: 0.7,
          messages: [{
            role: "user",
            content: message
          }],
          system: "You are Claude, a helpful AI assistant. Provide clear, concise responses."
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, details: ${errorText}`);
      }

      const data = await response.json();
      console.log('Response from Claude:', data);

      if (data && data.content && data.content[0] && data.content[0].text) {
        appendMessage(data.content[0].text, false);
      } else {
        console.error('Unexpected response format:', data);
        appendMessage('Error: Unexpected response format from Claude', false);
      }
    } catch (error) {
      console.error('Error details:', error);
      appendMessage('Error: ' + error.message, false);
    }

    isWaitingForResponse = false;
    sendButton.disabled = false;
  }

  sendButton.addEventListener('click', sendMessage);
  messageInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });
});
