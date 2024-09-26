let prompts = [];

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

document.getElementById('addPrompt').addEventListener('click', () => {
  const name = document.getElementById('newPromptName').value;
  const content = document.getElementById('newPromptContent').value;
  if (name && content) {
    prompts.push({ name, content });
    savePrompts();
    renderPrompts();
    document.getElementById('newPromptName').value = '';
    document.getElementById('newPromptContent').value = '';
  }
});

function renderPrompts() {
  const promptList = document.getElementById('promptList');
  promptList.innerHTML = '';
  prompts.forEach((prompt, index) => {
    const promptItem = document.createElement('div');
    promptItem.className = 'prompt-item';
    promptItem.innerHTML = `
      <span>${prompt.name}</span>
      <button class="edit-prompt" data-index="${index}">Edit</button>
      <button class="delete-prompt" data-index="${index}">Delete</button>
    `;
    promptList.appendChild(promptItem);
  });

  // Add event listeners for edit and delete buttons
  document.querySelectorAll('.edit-prompt').forEach(button => {
    button.addEventListener('click', editPrompt);
  });
  document.querySelectorAll('.delete-prompt').forEach(button => {
    button.addEventListener('click', deletePrompt);
  });
}

function editPrompt(event) {
  const index = event.target.getAttribute('data-index');
  const prompt = prompts[index];
  document.getElementById('newPromptName').value = prompt.name;
  document.getElementById('newPromptContent').value = prompt.content;
  prompts.splice(index, 1);
  savePrompts();
  renderPrompts();
}

function deletePrompt(event) {
  const index = event.target.getAttribute('data-index');
  prompts.splice(index, 1);
  savePrompts();
  renderPrompts();
}

function savePrompts() {
  chrome.storage.sync.set({ prompts });
}

function loadPrompts() {
  chrome.storage.sync.get(['apiKey', 'model', 'prompts'], (result) => {
    if (result.apiKey) document.getElementById('apiKey').value = result.apiKey;
    if (result.model) document.getElementById('model').value = result.model;
    if (result.prompts) {
      prompts = result.prompts;
      renderPrompts();
    }
  });
}

// Load saved settings and prompts when popup opens
loadPrompts();