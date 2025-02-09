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
document.getElementById('dropZone').addEventListener('click', function() {
    document.getElementById('fileInput').click();
});


document.getElementById('uploadButton').addEventListener('click', function() {
    const file = document.getElementById('fileInput').files[0];
    if (file) {
        processPDF(file, encryptionKey, socket);
    } else {
        alert('Bitte wählen Sie eine Datei aus.');
    }
});

init();
