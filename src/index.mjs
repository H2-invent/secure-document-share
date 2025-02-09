import { generateKey, encryptData, decryptData } from "./encryption.mjs";
import { processPDF } from "./pdfProcessor.mjs";
import "./styles.scss";
import {loadDocumentPreviews} from "./createDokumentList.mjs";

import { io } from "socket.io-client"; // ✅ Socket.IO Client einbinden
import "bootstrap/dist/js/bootstrap.bundle.min.js"; // Bootstrap JS (inkl. Popper.js)

let encryptionKey;
export const socket = io(); // ✅ Verbindung mit Socket.IO Server

async function init() {
    encryptionKey = await generateKey();
    await loadDocumentPreviews();
}

document.getElementById("dropZone").addEventListener("dragover", e => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
});

document.getElementById("dropZone").addEventListener("drop", e => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type === "application/pdf") {
        processPDF(file, encryptionKey, socket);
    }
});
//
// socket.onmessage = async (event) => {
//     const data = JSON.parse(event.data);
//
//     if (data.action === "saved") {
//         console.log(`Bild gespeichert mit ID: ${data.id}`);
//     } else if (data.action === "retrieve") {
//         const encryptedBuffer = new Uint8Array(data.encrypted);
//         const ivBuffer = new Uint8Array(data.iv);
//         const decrypted = await decryptData(encryptedBuffer.buffer, ivBuffer.buffer, encryptionKey);
//
//         const blob = new Blob([decrypted], { type: "image/png" });
//         const img = document.createElement("img");
//         img.src = URL.createObjectURL(blob);
//         img.dataset.id = data.id;
//         img.onclick = () => deleteImage(img);
//         document.getElementById("previewContainer").appendChild(img);
//     }
// };

init();
