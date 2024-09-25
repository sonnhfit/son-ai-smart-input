document.getElementById('saveSettings').addEventListener('click', () => {
    const apiKey = document.getElementById('apiKey').value;
    const model = document.getElementById('model').value;
    chrome.storage.sync.set({ apiKey, model }, () => {
      alert('Settings saved!');
    });
  });
  
  document.getElementById('openPrompt').addEventListener('click', () => {
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, {action: "open_prompt"});
    });
  });
  
  // Load saved settings when popup opens
  chrome.storage.sync.get(['apiKey', 'model'], (result) => {
    if (result.apiKey) document.getElementById('apiKey').value = result.apiKey;
    if (result.model) document.getElementById('model').value = result.model;
  });