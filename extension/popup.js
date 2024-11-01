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
          messages: [{
            role: 'user',
            content: message
          }]
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Response from Claude:', data); // Para debugging

      if (data && data.content) {
        appendMessage(data.content, false);
      } else {
        appendMessage('Error: Invalid response format from Claude', false);
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
