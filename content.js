let textBox = null;
let lastFocusedElement = null;
let submitButton = null;
let selectedText = '';

function closeTextBox() {
  if (textBox) {
    textBox.remove();
    document.removeEventListener('click', closeTextBoxOnClickOutside);
    textBox = null;
    
    if (lastFocusedElement) {
      lastFocusedElement.focus();
      if (lastFocusedElement.tagName === 'INPUT' || lastFocusedElement.tagName === 'TEXTAREA') {
        const len = lastFocusedElement.value.length;
        lastFocusedElement.setSelectionRange(len, len);
      }
    }
  }
}

function closeTextBoxOnClickOutside(e) {
  if (textBox && !textBox.contains(e.target) && e.target !== lastFocusedElement) {
    closeTextBox();
  }
}

function submitToAPI(content) {
  chrome.storage.sync.get(['apiKey', 'model'], (result) => {
    if (!result.apiKey) {
      alert('Please set your API key in the extension popup');
      return;
    }

    const apiUrl = 'https://api.openai.com/v1/chat/completions';
    const apiKey = result.apiKey;
    const model = result.model || 'gpt-4o-mini';

    submitButton.disabled = true;
    submitButton.style.backgroundColor = '#cccccc';

    fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant."
          },
          {
            role: "user",
            content: content
          }
        ]
      })
    })
    .then(response => response.json())
    .then(data => {
      if (data.choices && data.choices.length > 0) {
        const output = data.choices[0].message.content;
        if (lastFocusedElement && (lastFocusedElement.tagName === 'INPUT' || lastFocusedElement.tagName === 'TEXTAREA')) {
          lastFocusedElement.value = output;
          
          const inputEvent = new Event('input', { bubbles: true });
          lastFocusedElement.dispatchEvent(inputEvent);
        } else {
          const textarea = textBox.querySelector('textarea');
          textarea.value = output;
        }
      } else {
        console.error('API response does not contain expected output');
      }
    })
    .catch(error => {
      console.error('Error:', error);
    })
    .finally(() => {
      submitButton.disabled = false;
      submitButton.style.backgroundColor = '#4CAF50';
    });
  });
}

function getSelectedText() {
  if (window.getSelection) {
    return window.getSelection().toString();
  } else if (document.selection && document.selection.type != "Control") {
    return document.selection.createRange().text;
  }
  return '';
}

function createTextBox(initialText) {
  textBox = document.createElement('div');
  textBox.id = 'smart-input-assistant-box';
  textBox.style.cssText = `
    position: fixed;
    z-index: 10000;
    background: white;
    border: 1px solid #ccc;
    padding: 10px;
    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
  `;

  const closeButton = document.createElement('button');
  closeButton.innerHTML = '&times;';
  closeButton.style.cssText = `
    position: absolute;
    top: 5px;
    right: 5px;
    background: none;
    border: none;
    font-size: 18px;
    cursor: pointer;
    padding: 0;
    line-height: 1;
    color: #333;
  `;
  closeButton.addEventListener('click', (e) => {
    e.stopPropagation();
    closeTextBox();
  });
  textBox.appendChild(closeButton);

  // Create prompt buttons container
  const promptButtonsContainer = document.createElement('div');
  promptButtonsContainer.style.cssText = `
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
    margin-bottom: 10px;
  `;
  textBox.appendChild(promptButtonsContainer);

  // Add prompt buttons
  chrome.storage.sync.get(['prompts'], (result) => {
    if (result.prompts) {
      result.prompts.forEach((prompt, index) => {
        const promptButton = document.createElement('button');
        promptButton.textContent = prompt.name;
        promptButton.style.cssText = `
          padding: 5px 10px;
          background-color: #f0f0f0;
          border: 1px solid #ccc;
          border-radius: 3px;
          cursor: pointer;
        `;
        promptButton.addEventListener('click', () => {
          const textarea = textBox.querySelector('textarea');
          textarea.value += (textarea.value ? '\n' : '') + prompt.content;
        });
        promptButtonsContainer.appendChild(promptButton);
      });
    }
  });

  const textarea = document.createElement('textarea');
  textarea.style.cssText = `
    width: 400px;
    height: 200px;
    resize: both;
    margin-bottom: 10px;
  `;
  textarea.value = initialText;
  textBox.appendChild(textarea);

  submitButton = document.createElement('button');
  submitButton.textContent = 'Submit';
  submitButton.style.cssText = `
    display: block;
    margin-top: 10px;
    padding: 5px 10px;
    background-color: #4CAF50;
    color: white;
    border: none;
    cursor: pointer;
  `;
  submitButton.addEventListener('click', () => submitToAPI(textarea.value));
  textBox.appendChild(submitButton);

  // Position the textbox near the mouse cursor
  textBox.style.left = `${Math.min(window.innerWidth - 220, Math.max(0, lastMouseX))}px`;
  textBox.style.top = `${Math.min(window.innerHeight - 200, Math.max(0, lastMouseY))}px`;

  document.body.appendChild(textBox);

  textarea.focus();
  textarea.setSelectionRange(textarea.value.length, textarea.value.length);

  document.addEventListener('click', closeTextBoxOnClickOutside);
}

let lastMouseX = 0;
let lastMouseY = 0;

document.addEventListener('mousemove', (e) => {
  lastMouseX = e.clientX;
  lastMouseY = e.clientY;
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Message received in content script:", request);
  if (request.action === "open_prompt") {
    console.log("Open prompt action received");
    
    if (textBox) {
      closeTextBox();
      sendResponse({success: true, message: "Text box closed"});
    } else {
      const focusedElement = document.activeElement;
      selectedText = '';
      
      if (focusedElement && (focusedElement.tagName === 'INPUT' || focusedElement.tagName === 'TEXTAREA')) {
        lastFocusedElement = focusedElement;
        if (focusedElement.selectionStart !== undefined) {
          selectedText = focusedElement.value.substring(focusedElement.selectionStart, focusedElement.selectionEnd);
        }
      } else {
        selectedText = getSelectedText();
      }
      
      if (selectedText || (focusedElement && (focusedElement.tagName === 'INPUT' || focusedElement.tagName === 'TEXTAREA'))) {
        createTextBox(selectedText);
        sendResponse({success: true, message: "Text box opened"});
      } else {
        console.log("No text selected and no input element is focused");
        sendResponse({success: false, message: "No text selected and no input element is focused"});
      }
    }
  }
  return true;
});