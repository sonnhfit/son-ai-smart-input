let selectedText = '';
let activeElement = null;

document.addEventListener('mouseup', () => {
  const selection = window.getSelection().toString().trim();
  if (selection) {
    selectedText = selection;
    activeElement = document.activeElement;
  }
});

document.addEventListener('focus', (event) => {
  if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
    activeElement = event.target;
    selectedText = '';
  }
}, true);

document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
    e.preventDefault();
    if (activeElement) {
      showPromptInput();
    }
  }
});

function showPromptInput() {
  if (!activeElement) return;

  const promptContainer = document.createElement('div');
  promptContainer.style.cssText = `
    position: absolute;
    background-color: white;
    border: 1px solid #ccc;
    padding: 10px;
    z-index: 10000;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  `;

  const promptInput = document.createElement('textarea');
  promptInput.placeholder = 'Enter your prompt';
  promptInput.style.width = '300px';
  promptInput.style.height = '100px';
  promptInput.value = selectedText; // Pre-fill with selected text if available

  const submitButton = document.createElement('button');
  submitButton.textContent = 'Submit';
  submitButton.style.marginLeft = '10px';

  promptContainer.appendChild(promptInput);
  promptContainer.appendChild(submitButton);
  document.body.appendChild(promptContainer);

  // Position the prompt container next to the active element
  const rect = activeElement.getBoundingClientRect();
  const scrollX = window.scrollX || window.pageXOffset;
  const scrollY = window.scrollY || window.pageYOffset;

  // Calculate the position
  let left = rect.right + scrollX + 10; // 10px to the right of the active element
  let top = rect.top + scrollY;

  // Check if the prompt container goes off-screen horizontally
  if (left + promptContainer.offsetWidth > window.innerWidth + scrollX) {
    left = rect.left + scrollX - promptContainer.offsetWidth - 10; // 10px to the left of the active element
  }

  // Check if the prompt container goes off-screen vertically
  if (top + promptContainer.offsetHeight > window.innerHeight + scrollY) {
    top = rect.bottom + scrollY - promptContainer.offsetHeight;
  }

  promptContainer.style.left = `${left}px`;
  promptContainer.style.top = `${top}px`;

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
  chrome.runtime.sendMessage({
    action: "processPrompt",
    prompt: prompt,
    selectedText: selectedText
  }, (response) => {
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