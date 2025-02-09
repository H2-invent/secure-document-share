import {findDataById} from "./db.mjs";
import {downloadImage} from "./downloadImage.mjs";
import {socket} from "./index.mjs";

const mainImage = document.getElementById("mainImage");
const thumbnailsContainer = document.getElementById("thumbnails");
let encryptionKeySlideshow = null;

export async function loadSlideshow(id) {
    const {filename, exportedKey, uploadIds} = findDataById(id)

    thumbnailsContainer.innerHTML = ""; // Reset Thumbnails
    encryptionKeySlideshow = exportedKey;
    socket.emit('startSlideshow', {'docId': id});

    for (let i = 0; i < uploadIds.length; i++) {
        const decryptedBlob = await downloadImage(uploadIds[i], exportedKey);

        // Erstelle ein Bild-Element
        const img = document.createElement("img");
        img.src = URL.createObjectURL(decryptedBlob);
        img.alt = filename;
        img.style.width =  "80px"; // Erstes Bild groß
        img.style.cursor = "pointer";
        img.addEventListener("click", async () => {
            const newDecryptedBlob = await downloadImage(uploadIds[i], exportedKey);
            mainImage.src = URL.createObjectURL(newDecryptedBlob);
            socket.emit('changeImage', {'docId': id, 'imageId': uploadIds[i]});
        });
        thumbnailsContainer.appendChild(img);

        if (i === 0) {
            const img = document.createElement("img");
            img.src = URL.createObjectURL(decryptedBlob);
            img.alt = filename;
            mainImage.src = img.src; // Erstes Bild als Hauptbild setzen
            socket.emit('changeImage', {'docId': id, 'imageId': uploadIds[i]});

        }

    }
}

document.addEventListener("DOMContentLoaded", loadSlideshow);