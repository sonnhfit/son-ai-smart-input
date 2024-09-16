let selectedText = '';
let activeElement = null;

document.addEventListener('mouseup', () => {
  const selection = window.getSelection().toString().trim();
  if (selection) {
    selectedText = selection;
    activeElement = document.activeElement;
  }
});

document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
    e.preventDefault();
    showPromptInput();
  }
});

function showPromptInput() {
  const promptContainer = document.createElement('div');
  promptContainer.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background-color: white;
    border: 1px solid #ccc;
    padding: 10px;
    z-index: 10000;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  `;

  const promptInput = document.createElement('input');
  promptInput.type = 'text';
  promptInput.placeholder = 'Enter your prompt';
  promptInput.style.width = '300px';

  const submitButton = document.createElement('button');
  submitButton.textContent = 'Submit';
  submitButton.style.marginLeft = '10px';

  promptContainer.appendChild(promptInput);
  promptContainer.appendChild(submitButton);
  document.body.appendChild(promptContainer);

  submitButton.addEventListener('click', () => {
    const prompt = promptInput.value.trim();
    if (prompt) {
      sendPromptToBackground(prompt);
    }
    document.body.removeChild(promptContainer);
  });

  promptInput.focus();
}

function sendPromptToBackground(prompt) {
  chrome.runtime.sendMessage({action: "processPrompt", prompt: prompt}, (response) => {
    if (response && response.success) {
      replaceSelectedText(response.result);
    }
  });
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "processInput" && activeElement) {
    replaceSelectedText(request.input);
    sendResponse({success: true});
  } else {
    sendResponse({success: false});
  }
  return true; // Keeps the message channel open for asynchronous response
});

function replaceSelectedText(replacementText) {
  if (activeElement.tagName === 'TEXTAREA' || activeElement.tagName === 'INPUT') {
    const start = activeElement.selectionStart;
    const end = activeElement.selectionEnd;
    activeElement.value = activeElement.value.substring(0, start) + replacementText + activeElement.value.substring(end);
    activeElement.setSelectionRange(start + replacementText.length, start + replacementText.length);
  } else if (activeElement.isContentEditable) {
    const selection = window.getSelection();
    const range = selection.getRangeAt(0);
    range.deleteContents();
    range.insertNode(document.createTextNode(replacementText));
    range.collapse(false);
  }
  activeElement.focus();
}