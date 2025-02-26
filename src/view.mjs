import "./styles.scss";
import { io } from "socket.io-client";
import data from "bootstrap/js/src/dom/data.js";
import {downloadImage} from "./downloadImage.mjs";

const socket = io(); // Verbindung mit dem Server herstellen

// URL analysieren und `docId` extrahieren
const urlParts = window.location.pathname.split("/");
const docId = urlParts[urlParts.length - 1];

// Fragment (`#`) aus der URL holen
const hash = window.location.hash; // Beispiel: `#key=TVlTRUNSRVQtS0VZ`
const encodedKey = hash.startsWith("#key=") ? hash.substring(5) : null;
const mainImage = document.getElementById("mainImage");

// Funktion zur sicheren Base64-URL-Dekodierung
function decodeBase64UrlSafe(base64UrlString) {
    try {
        if (!base64UrlString) throw new Error("Kein Schlüssel in der URL gefunden.");

        // Ersetze URL-sichere Zeichen zurück in reguläre Base64-Zeichen
        let base64String = base64UrlString.replace(/-/g, "+").replace(/_/g, "/");

        // Fehlende Padding-Zeichen ergänzen (Base64 benötigt Länge % 4 === 0)
        while (base64String.length % 4 !== 0) {
            base64String += "=";
        }

        // Base64 dekodieren
        return atob(base64String);
    } catch (error) {
        console.error("❌ Fehler beim Dekodieren des Schlüssels:", error.message);
        return null;
    }
}

// Schlüssel sicher dekodieren
const encryptionKey = encodedKey ? decodeBase64UrlSafe(encodedKey) : null;

// Debugging (nur für Entwicklung, später entfernen)
console.log("📌 docId:", docId);
console.log("🔑 Encryption Key (decoded):", encryptionKey);


// Beispiel: Nachrichtenempfang
socket.on("newImage", async (data) => {
    const imageId = data['imageId'];
    const newDecryptedBlob = await downloadImage(imageId, encryptionKey);
    mainImage.src = URL.createObjectURL(newDecryptedBlob);

});

// Punkt zur Anzeige der Mausposition erstellen
const cursorDot = document.createElement("div");
cursorDot.style.position = "absolute";
cursorDot.style.width = "10px";
cursorDot.style.height = "10px";
cursorDot.style.backgroundColor = "red";
cursorDot.style.borderRadius = "50%";
cursorDot.style.pointerEvents = "none";
cursorDot.style.transform = "translate(-50%, -50%)";
cursorDot.style.display = "none"; // Standardmäßig ausblenden
mainImage.parentElement.appendChild(cursorDot);

// Nachrichtenempfang für neue Bilder
socket.on("newImage", async (data) => {
    const imageId = data["imageId"];
    const newDecryptedBlob = await downloadImage(imageId, encryptionKey);
    mainImage.src = URL.createObjectURL(newDecryptedBlob);
});

// Nachrichtenempfang für Mausbewegung
socket.on("pointer", (data) => {
    if (data.docId !== docId) return;

    const rect = mainImage.getBoundingClientRect();
    const xPos = (data.x / 100) * rect.width;
    const yPos = (data.y / 100) * rect.height;

    cursorDot.style.left = `${xPos}px`;
    cursorDot.style.top = `${yPos}px`;
    cursorDot.style.display = "block";
});
