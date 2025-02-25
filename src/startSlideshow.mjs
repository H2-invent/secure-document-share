import {findDataById} from "./db.mjs";
import {downloadImage} from "./downloadImage.mjs";
import {socket} from "./index.mjs";

const mainImage = document.getElementById("mainImage");
const thumbnailsContainer = document.getElementById("thumbnails");
let encryptionKeySlideshow = null;
export async function loadSlideshow(id) {
    const { filename, exportedKey, uploadIds } = findDataById(id);

    thumbnailsContainer.innerHTML = ""; // Reset Thumbnails
    encryptionKeySlideshow = exportedKey;
    socket.emit("startSlideshow", { docId: id });

    let currentIndex = 0; // Aktuelles Bild
    const totalImages = uploadIds.length;

    // Funktion zum Aktualisieren des Hauptbilds
    async function updateMainImage(index) {
        if (index < 0 || index >= totalImages) return; // Begrenzung
        currentIndex = index;
        const decryptedBlob = await downloadImage(uploadIds[currentIndex], exportedKey);
        mainImage.src = URL.createObjectURL(decryptedBlob);
        socket.emit("changeImage", { docId: id, imageId: uploadIds[currentIndex] });
    }
    updateMainImage(0);
    // Pfeiltasten erstellen
    const prevButton = document.createElement("button");
    prevButton.textContent = "◀";
    prevButton.classList.add("btn", "btn-secondary", "me-2");

    prevButton.addEventListener("click", () => updateMainImage(currentIndex - 1));

    const nextButton = document.createElement("button");
    nextButton.textContent = "▶";
    nextButton.classList.add("btn", "btn-secondary", "ms-2");

    nextButton.addEventListener("click", () => updateMainImage(currentIndex + 1));

    // Container für die Navigation über dem Hauptbild
    const navContainer = document.createElement("div");
    navContainer.classList.add("d-flex", "justify-content-center", "mb-2");
    navContainer.appendChild(prevButton);
    navContainer.appendChild(nextButton);

    // Navigation über das Hauptbild einfügen
    const slideshowContainer = document.getElementById("slideshow");
    slideshowContainer.insertBefore(navContainer, mainImage);

    // Thumbnail-Bilder laden
    for (let i = 0; i < totalImages; i++) {
        const decryptedBlob = await downloadImage(uploadIds[i], exportedKey);

        const img = document.createElement("img");
        img.src = URL.createObjectURL(decryptedBlob);
        img.alt = filename;
        img.style.width = "80px";
        img.style.cursor = "pointer";
        img.classList.add("m-1", "thumbnail"); // Styling für Abstand

        img.addEventListener("click", () => updateMainImage(i));

        thumbnailsContainer.appendChild(img);
    }

    // Erstes Bild als Startbild setzen

}

document.addEventListener("DOMContentLoaded", loadSlideshow);