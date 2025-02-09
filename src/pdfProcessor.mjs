import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import "pdfjs-dist/legacy/build/pdf.worker.mjs";
import {decryptData, encryptData, exportKey} from "./encryption.mjs";
import { saveDocumentToLocalStorage } from "./db.mjs";
import {loadDocumentPreviews} from "./createDokumentList.mjs"; // Mini-Datenbank-Funktion

pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

export async function processPDF(file, encryptionKey, socket) {
    const reader = new FileReader();

    reader.onload = async function () {
        const pdfData = new Uint8Array(reader.result);

        try {
            const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
            console.log("📄 PDF geladen:", pdf);

            const previewContainer = document.getElementById("previewContainer");
            const uploadIds = []; // Hier speichern wir die IDs der Bilder

            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const canvas = document.createElement("canvas");
                const context = canvas.getContext("2d");
                const viewport = page.getViewport({ scale: 2 });

                canvas.width = viewport.width;
                canvas.height = viewport.height;

                await page.render({ canvasContext: context, viewport }).promise;

                // Das Bild verschlüsseln und senden
                canvas.toBlob(async blob => {
                    const arrayBuffer = await blob.arrayBuffer();
                    const { encrypted, iv } = await encryptData(arrayBuffer, encryptionKey);

                    // Konvertiere in Uint8Array für effiziente Übertragung
                    const encryptedArray = new Uint8Array(encrypted); // ✅ Fix: ArrayBuffer -> Uint8Array


                    socket.emit("upload", {
                        action: "upload",
                        iv: iv.buffer,
                        encrypted: encryptedArray.buffer // Senden als ArrayBuffer
                    });
                }, "image/png");

                // WebSocket antwortet mit der Upload-ID (Listener hinzufügen)


                // Vorschaubild im UI anzeigen
                const img = document.createElement("img");
                img.src = canvas.toDataURL("image/png");
                img.dataset.page = i;
                img.onclick = () => deleteImage(img);
                previewContainer.appendChild(img);
            }
            socket.on('saved',async (data)=> {
                uploadIds.push(data.id);

                // Speichern, wenn alle Seiten hochgeladen wurden
                if (uploadIds.length === pdf.numPages) {
                   await  saveDocumentToLocalStorage(file.name,  encryptionKey, uploadIds);
                    loadDocumentPreviews();
                }
            });
        } catch (error) {
            console.error("❌ Fehler beim Laden des PDFs:", error);
        }

    };

    reader.readAsArrayBuffer(file);
}