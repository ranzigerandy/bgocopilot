
document.addEventListener('DOMContentLoaded', () => {
    const sendButton = document.getElementById('send-data');
    const statusMessage = document.getElementById('status');
    const imageCount = document.getElementById('image-count');
    const selectedImagesList = document.getElementById('selected-images-list');

    function updatePopup() {
        chrome.storage.local.get("selectedImages", (data) => {
            const images = data.selectedImages || [];
            imageCount.textContent = `${images.length} afbeelding(en) geselecteerd`;
            selectedImagesList.innerHTML = '';
            
            // Knop is nu altijd actief
            sendButton.disabled = false;

            images.forEach(image => {
                const li = document.createElement('li');
                const img = document.createElement('img');
                img.src = image.thumbnailUrl;
                li.appendChild(img);

                const removeBtn = document.createElement('button');
                removeBtn.className = 'remove-btn';
                removeBtn.innerHTML = '&times;';
                removeBtn.dataset.hqUrl = image.highQualityUrl;
                li.appendChild(removeBtn);
                selectedImagesList.appendChild(li);
            });
        });
    }
    
    selectedImagesList.addEventListener('click', (event) => {
        if (event.target.classList.contains('remove-btn')) {
            const hqUrlToRemove = event.target.dataset.hqUrl;
            chrome.storage.local.get("selectedImages", (data) => {
                const imageToRemove = (data.selectedImages || []).find(img => img.highQualityUrl === hqUrlToRemove);
                if (imageToRemove) {
                    chrome.runtime.sendMessage({ action: "toggleSelection", image: imageToRemove });
                }
            });
        }
    });

    sendButton.addEventListener('click', async () => {
        sendButton.disabled = true;
        statusMessage.textContent = 'Bezig met versturen...';
        statusMessage.style.color = '#f0f0f0';

        const response = await chrome.runtime.sendMessage({ action: "sendAllData" });

        if (response.success) {
            statusMessage.textContent = response.message;
            statusMessage.style.color = '#4caf50';
        } else {
            statusMessage.textContent = response.message;
            statusMessage.style.color = '#dc3545';
            sendButton.disabled = false;
        }
    });
    
    updatePopup();

    chrome.storage.onChanged.addListener((changes, namespace) => {
        if (namespace === 'local' && changes.selectedImages) {
            updatePopup();
        }
    });
});
