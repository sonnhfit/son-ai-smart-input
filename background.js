// chrome.commands.onCommand.addListener((command) => {
//   if (command === "open_prompt") {
//     chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
//       if (chrome.runtime.lastError) {
//         console.error(chrome.runtime.lastError);
//         return;
//       }

//       if (tabs.length === 0) {
//         console.error("No active tab found");
//         return;
//       }

//       const activeTab = tabs[0];
//       console.log("Command open_prompt triggered for tab:", activeTab.id);

//       chrome.tabs.sendMessage(activeTab.id, { action: "open_prompt" }, (response) => {
//         if (chrome.runtime.lastError) {
//           console.error("Error sending message:", chrome.runtime.lastError);
//         } else {
//           console.log("Message sent successfully, response:", response);
//         }
//       });
//     });
//   }
// });

chrome.commands.onCommand.addListener((command) => {
  if (command === "open_prompt") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError);
        return;
      }

      if (tabs.length === 0) {
        console.error("No active tab found");
        return;
      }

      const activeTab = tabs[0];
      console.log("Command open_prompt triggered for tab:", activeTab.id);

      chrome.tabs.sendMessage(activeTab.id, { action: "open_prompt" }, (response) => {
        if (chrome.runtime.lastError) {
          console.error("Error sending message:", chrome.runtime.lastError.message);
        } else if (response) {
          console.log("Message sent successfully, response:", response);
        } else {
          console.log("No response received");
        }
      });
    });
  }
});