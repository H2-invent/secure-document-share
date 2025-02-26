import {findDataById} from "./db.mjs";
import {downloadImage} from "./downloadImage.mjs";
import {socket} from "./index.mjs";

const mainImage = document.getElementById("mainImage");
const thumbnailsContainer = document.getElementById("thumbnails");
const slideShowContainer = document.getElementById('slideShowContainer');
let docId = null;
let encryptionKeySlideshow = null;

export async function loadSlideshow(id) {
    docId = id;
    const {filename, exportedKey, uploadIds} = findDataById(id);
    slideShowContainer.classList.remove('d-none');
    thumbnailsContainer.innerHTML = ""; // Reset Thumbnails
    encryptionKeySlideshow = exportedKey;
    socket.emit("startSlideshow", {docId: id});

    let currentIndex = 0; // Aktuelles Bild
    const totalImages = uploadIds.length;
    const thumbnails = []; // Array zur Speicherung der Thumbnail-Elemente
    await updateMainImage(0);

    // Funktion zum Aktualisieren des Hauptbilds und Markierung des Thumbnails
    async function updateMainImage(index) {
        if (index < 0 || index >= totalImages) return; // Begrenzung
        currentIndex = index;
        const decryptedBlob = await downloadImage(uploadIds[currentIndex], exportedKey);
        mainImage.src = URL.createObjectURL(decryptedBlob);
        socket.emit("changeImage", {docId: id, imageId: uploadIds[currentIndex]});

        // Markierung des aktuellen Thumbnails
        thumbnails.forEach((thumb, i) => {
            if (i === currentIndex) {
                thumb.classList.add("border", "border-primary", "border-3");
            } else {
                thumb.classList.remove("border", "border-primary", "border-3");
            }
        });
    }

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
    const navigatorContainer = document.getElementById("navigator");
    navigatorContainer.innerHTML = '';
    navigatorContainer.insertAdjacentElement('afterbegin', navContainer)


    // Thumbnail-Bilder laden
    for (let i = 0; i < totalImages; i++) {
        const decryptedBlob = await downloadImage(uploadIds[i], exportedKey);

        const img = document.createElement("img");
        img.src = URL.createObjectURL(decryptedBlob);
        img.alt = filename;
        img.style.width = "80px";
        img.style.cursor = "pointer";
        img.classList.add("m-1", "thumbnail"); // Grundstyling für Thumbnails

        img.addEventListener("click", () => updateMainImage(i));

        thumbnailsContainer.appendChild(img);
        thumbnails.push(img); // Thumbnail in Array speichern
    }

    // Erstes Bild als Startbild setzen

}

function trackMousePosition(event) {
    if (docId) {
        const rect = mainImage.getBoundingClientRect();
        const xPercent = ((event.clientX - rect.left) / rect.width) * 100;
        const yPercent = ((event.clientY - rect.top) / rect.height) * 100;

        socket.emit("mouseMove", {docId: docId, x: xPercent, y: yPercent});
    }
}

mainImage.addEventListener("mousemove", trackMousePosition);
document.addEventListener("DOMContentLoaded", loadSlideshow);