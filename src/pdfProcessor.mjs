import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import "pdfjs-dist/legacy/build/pdf.worker.mjs";
import { decryptData, encryptData, exportKey } from "./encryption.mjs";
import { saveDocumentToLocalStorage } from "./db.mjs";
import { loadDocumentPreviews } from "./createDokumentList.mjs"; // Mini-Datenbank-Funktion

pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

const MAX_UPLOADS = 3;
let activeUploads = 0;
let init = false;
let uploadIds = null;
export async function processPDF(file, encryptionKey, socket) {
    if (init == false){
        socket.on("saved", async (data) => {
            uploadIds[data.page] = data.id;
            updateProgressBar();
            if (!uploadIds.includes(null)) {
                await saveDocumentToLocalStorage(file.name, encryptionKey, uploadIds);
                loadDocumentPreviews();
                activeUploads--;
            }
        });
        init = true;
    }
    if (activeUploads >= MAX_UPLOADS) {
        alert("Es können maximal drei Dokumente gleichzeitig hochgeladen werden.");
        return;
    }
    activeUploads++;

    const reader = new FileReader();

    reader.onload = async function () {
        const pdfData = new Uint8Array(reader.result);

        try {
            const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
            console.log("📄 PDF geladen:", pdf);

            const previewContainer = document.getElementById("previewContainer");
            previewContainer.innerHTML='';
            uploadIds = new Array(pdf.numPages).fill(null);
            createProgressBar(pdf.numPages);

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
                    const page = i-1;
                    socket.emit("upload", {
                        action: "upload",
                        page: page,
                        iv: iv.buffer,
                        encrypted: new Uint8Array(encrypted).buffer
                    });
                }, "image/png");

                // Vorschaubild im UI anzeigen
                const img = document.createElement("img");
                img.src = canvas.toDataURL("image/png");
                img.dataset.page = i;
                img.onclick = () => deleteImage(img);
                previewContainer.appendChild(img);
            }


        } catch (error) {
            console.error("❌ Fehler beim Laden des PDFs:", error);
            activeUploads--;
        }
    };

    reader.readAsArrayBuffer(file);
}


function createProgressBar(totalPages) {
    let progressContainer = document.getElementById("progressContainer");
    if (!progressContainer) {
        progressContainer = document.createElement("div");
        progressContainer.id = "progressContainer";
        progressContainer.style.width = "100%";
        progressContainer.style.backgroundColor = "#ddd";
        progressContainer.style.marginTop = "10px";
        document.body.appendChild(progressContainer);
    }

    let progressBar = document.getElementById("progressBar");
    if (!progressBar) {
        progressBar = document.createElement("div");
        progressBar.id = "progressBar";
        progressBar.classList.add('progressbar')
        progressBar.style.backgroundColor = "#baae41";
        progressContainer.appendChild(progressBar);
    }
    progressBar.textContent='Upload läuft. Bitte warten';
    progressBar.dataset.totalPages = totalPages;
    updateProgressBar();
}

function updateProgressBar() {
    const progressBar = document.getElementById("progressBar");
    if (progressBar) {
        const totalPages = parseInt(progressBar.dataset.totalPages);
        const uploadedPages = uploadIds.filter(id => id !== null).length;
        const progress = (uploadedPages / totalPages) * 100;
        progressBar.style.width = `${progress}%`;
        if (progress === 100){
            progressBar.style.backgroundColor='#369f36';
            progressBar.textContent='Upload abgeschlossen. Klicken Sie Ihre Präsentation unten an um diese zu teilen.'
            document.getElementById('previewContainer').innerHTML= '';
        }
    }
}

