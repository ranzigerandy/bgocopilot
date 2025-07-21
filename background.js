// Initialiseer de selectie bij installatie.
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ selectedImages: [] });
});

// Luistert naar berichten van popup.js en content.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Gebruik een switch voor betere leesbaarheid
  switch (request.action) {
    case "toggleSelection":
      handleToggleSelection(request.image).then(sendResponse);
      return true; // Houdt het kanaal open voor async response

    case "sendAllData":
      handleSendAllData().then(sendResponse);
      return true; // Houdt het kanaal open voor async response
  }
});

/**
 * Voegt een afbeeldingsobject toe aan de selectie of verwijdert deze.
 * @param {object} imageObject - Het afbeeldingsobject om te wisselen.
 */
async function handleToggleSelection(imageObject) {
  const data = await chrome.storage.local.get("selectedImages");
  let images = data.selectedImages || [];
  const index = images.findIndex(item => item.highQualityUrl === imageObject.highQualityUrl);
  
  if (index > -1) {
    // Verwijder de afbeelding als deze al geselecteerd is
    images.splice(index, 1);
  } else {
    // Voeg de afbeelding toe als deze nog niet geselecteerd is
    images.push(imageObject);
  }

  await chrome.storage.local.set({ selectedImages: images });
  return { success: true, selectionCount: images.length };
}

/**
 * Orkestreert het verzamelen van alle data en het versturen naar de webhook.
 */
async function handleSendAllData() {
  const webhookUrl = 'https://kareldemeersseman.app.n8n.cloud/webhook/b5d37983-81ca-4f29-9218-38b3435ff814';

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab || !tab.id || !tab.url || !tab.url.startsWith('http')) {
      throw new Error("Kan de huidige pagina niet lezen. Zorg dat je op een ondersteunde pagina bent.");
    }

    // Vraag de content op van de content script.
    const scrapedResponse = await chrome.tabs.sendMessage(tab.id, { action: "scrapeContent" });
    
    if (!scrapedResponse || !scrapedResponse.pageContent) {
        throw new Error("Kon geen content van de pagina scrapen.");
    }

    const storageData = await chrome.storage.local.get("selectedImages");
    const selectedImages = storageData.selectedImages || [];
    const highQualityUrls = selectedImages.map(item => item.highQualityUrl);
    const pageUrl = selectedImages[0]?.pageUrl || tab.url;

    const payload = {
      pageUrl: pageUrl,
      pageContent: scrapedResponse.pageContent,
      imageUrls: highQualityUrls
    };

    const finalResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (finalResponse.ok) {
      await chrome.storage.local.set({ selectedImages: [] });
      return { success: true, message: "Accommodatie verstuurd 🚀" };
    } else {
      const errorText = await finalResponse.text();
      throw new Error(`Server-fout: ${finalResponse.status} - ${errorText}`);
    }
  } catch (error) {
    console.error('BGO Copilot: Fout bij het versturen van alle data:', error);
    return { success: false, message: `Fout: ${error.message}` };
  }
}