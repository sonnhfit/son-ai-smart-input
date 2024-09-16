document.addEventListener('DOMContentLoaded', function() {
    console.log('Popup opened');

    const submitBtn = document.getElementById('submitBtn');
    const smartInput = document.getElementById('smartInput');

    submitBtn.addEventListener('click', function() {
        const inputValue = smartInput.value.trim();
        if (inputValue) {
            chrome.runtime.sendMessage({action: "processPrompt", prompt: inputValue}, function(response) {
                if (chrome.runtime.lastError) {
                    console.error(chrome.runtime.lastError);
                    alert('Error: Unable to process prompt.');
                } else if (response && response.success) {
                    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                        chrome.tabs.sendMessage(tabs[0].id, {action: "processInput", input: response.result}, function(contentResponse) {
                            if (chrome.runtime.lastError) {
                                console.error(chrome.runtime.lastError);
                                alert('Error: Unable to send message to content script.');
                            } else if (contentResponse && contentResponse.success) {
                                smartInput.value = ''; // Clear the input
                                alert('Prompt processed and input updated successfully!');
                            } else {
                                alert('Error: Unable to update input in the page.');
                            }
                        });
                    });
                } else {
                    alert('Error: Unable to process prompt.');
                }
            });
        } else {
            alert('Please enter some text before submitting.');
        }
    });

    // Add keypress event listener for Enter key
    smartInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            submitBtn.click(); // Trigger click event on submit button
        }
    });
});
