let mediaRecorder;
const audioChunks = [];
const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6IndlYXJlZWR0QGdtYWlsLmNvbSIsInV1aWQiOiJlMTZiOGQ1Ny1jZDZmLTRkMTgtYmI1Mi00MWU1M2Y1ZjEzNDAifQ.qoFhT-sOQ96BU5tLXq2LExLDk5-Ab11VBy0fdCfFbgA'; // Replace with your actual API key
const chatApiUrl = 'https://api.mesolitica.com/chat/completions';

document.getElementById('toggle-frame').addEventListener('click', () => {
    const chatContent = document.getElementById('chat-content');
    chatContent.classList.toggle('hidden');
    const buttonText = chatContent.classList.contains('hidden') ? 'Open Chat' : 'Close Chat';
    document.getElementById('toggle-frame').textContent = buttonText;
});

let recordingText = document.getElementById('recording-status');

document.getElementById('start-recording').addEventListener('click', async () => {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  mediaRecorder = new MediaRecorder(stream);

  mediaRecorder.start();
  document.getElementById('start-recording').disabled = true;
  document.getElementById('stop-recording').disabled = false;
  
  // Show recording status
  recordingText.style.display = 'block'; // Show the recording status

  console.log("Starting recording...");

  mediaRecorder.ondataavailable = event => {
      audioChunks.push(event.data);
  };

  mediaRecorder.onstop = async () => {
      console.log("Recording stopped.");
      recordingText.style.display = 'none';
      const audioBlob = new Blob(audioChunks);
      const formData = new FormData();
      formData.append('file', audioBlob, 'audio.wav');
      formData.append('model', 'base');

      try {
          const response = await fetch('https://api.mesolitica.com/audio/transcriptions', {
              method: 'POST',
              headers: {
                  'Authorization': `Bearer ${apiKey}`
              },
              body: formData
          });

          console.log("Transcription response:", response);

          if (!response.ok) throw new Error('Error transcribing audio: ' + response.statusText);
          const transcription = await response.json();
          console.log("Transcription result:", transcription);

          appendMessage('You: ' + transcription);
          await sendMessageToBot(transcription); // Send transcription to bot

      } catch (error) {
          console.error(error);
          appendMessage('Error: ' + error.message);
      }

      audioChunks.length = 0; // Clear the audio chunks for the next recording
      document.getElementById('start-recording').disabled = false;
      document.getElementById('stop-recording').disabled = true;

      
  };
});


document.getElementById('clear-chat').addEventListener('click', () => {
    const outputDiv = document.getElementById('chat-output');
    outputDiv.innerHTML = ''; // Clear all previous chat messages
});

document.getElementById('stop-recording').addEventListener('click', () => {
    mediaRecorder.stop();
});

document.getElementById('send-message').addEventListener('click', async () => {
    const userInput = document.getElementById('user-input').value;
    appendMessage('You: ' + userInput); // Display user input
    await sendMessageToBot(userInput); // Send user input to bot
    document.getElementById('user-input').value = ''; // Clear input field
});

async function sendMessageToBot(message) {
    const chatData = {
        model: "mallam-small",
        messages: [
            { role: "user", content: message }
        ]
    };

    try {
        const response = await fetch(chatApiUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(chatData)
        });

        if (!response.ok) throw new Error('Error fetching chat response: ' + response.statusText);
        const chatResponse = await response.json();
        appendMessage('Bot: ' + chatResponse.choices[0].message.content); // Adjust based on actual response structure
    } catch (error) {
        console.error(error);
        appendMessage('Error: ' + error.message);
    }
}

function appendMessage(message) {
    const outputDiv = document.getElementById('chat-output');
    const messageElement = document.createElement('p');
    messageElement.textContent = message;
    outputDiv.appendChild(messageElement);
}
