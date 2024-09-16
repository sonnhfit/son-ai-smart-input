chrome.commands.onCommand.addListener((command) => {
  if (command === "toggle-feature") {
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, {action: "toggleInput"});
    });
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "processPrompt") {
    processPrompt(request.prompt, request.selectedText)
      .then(result => sendResponse({success: true, result: result}))
      .catch(error => sendResponse({success: false, error: error.message}));
    return true; // Indicates we will send a response asynchronously
  }
});

async function processPrompt(prompt, selectedText) {
  // Replace 'https://api.example.com/process' with the actual API endpoint
  const apiUrl = 'https://api.example.com/process';
  
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        prompt: prompt,
        selectedText: selectedText || '' // Include selected text if available
      }),
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    return data.result; // Assuming the API returns a JSON object with a 'result' field
  } catch (error) {
    console.error('Error processing prompt:', error);
    throw error;
  }
}