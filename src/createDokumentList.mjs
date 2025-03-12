import {deleteDocumentFromLocalStorage, getDocumentsFromLocalStorage} from "./db.mjs";
import {decryptData, importKey} from "./encryption.mjs";
import {downloadImage} from "./downloadImage.mjs";
import {loadSlideshow} from "./startSlideshow.mjs";

const listContainer = document.getElementById("documentList");

export async function loadDocumentPreviews() {
    listContainer.innerHTML = ""; // Reset Liste

    const documents = getDocumentsFromLocalStorage();

    for (const docId in documents) {
        let img = null;
        const { filename, exportedKey, uploadIds } = documents[docId];
        try {
            const decryptedBlob = await downloadImage(uploadIds[0], exportedKey);

            // Bild im UI anzeigen
             img = document.createElement("img");
            img.src = URL.createObjectURL(decryptedBlob);
            img.classList.add("pointer", "me-3"); // Abstand zum Text
            img.alt = filename;
            img.style.width = "100px";
            img.addEventListener("click", () => {
                loadSlideshow(docId);
            });
        }catch (e) {
            deleteDocumentFromLocalStorage(docId);
            continue;
        }
        // Präsentation starten Button
        const startBtn = document.createElement("button");
        startBtn.textContent = "Präsentation starten";
        startBtn.classList.add("btn", "btn-primary", "btn-sm", "me-2");
        startBtn.addEventListener("click", () => {
            loadSlideshow(docId);
        });

        // Löschbutton
        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Löschen";
        deleteButton.classList.add("btn", "btn-danger", "btn-sm");
        deleteButton.addEventListener("click", () => {
            deleteDocumentFromLocalStorage(docId);
            loadDocumentPreviews(); // Aktualisiert die Liste
        });

        // Share Link
        const encodedKey = btoa(exportedKey)
            .replace(/\+/g, "-")
            .replace(/\//g, "_")
            .replace(/=+$/, "");

        const shareUrl = `${window.location.origin}/view/${docId}#key=${encodedKey}`;



        const isInIframe = window.self !== window.top;
        const shareButton = document.createElement("button");

        shareButton.textContent = isInIframe ? "Präsentation bei allen Teilnehmern anzeigen" : "Link teilen";
        shareButton.classList.add("btn", "btn-secondary", "btn-sm","me-2");

        shareButton.addEventListener("click", async (event) => {
            event.preventDefault();

            try {
                if (isInIframe) {
                    loadSlideshow(docId);
                    window.parent.postMessage(
                        JSON.stringify({
                            type: "openNewIframeOnOthers",
                            url: shareUrl,
                            title: filename,
                        }),
                        "*"
                    );
                } else {
                    await navigator.clipboard.writeText(shareUrl);
                    // Bootstrap Modal erstellen und anzeigen
                    alert("Link wurde in die Zwischenablage kopiert!");
                }
            } catch (err) {
                console.error("Fehler beim Kopieren in die Zwischenablage:", err);
                alert("Kopieren in die Zwischenablage fehlgeschlagen.");
            }
        });

        // Listenelement erstellen mit flexibler Anordnung
        const listItem = document.createElement("li");
        listItem.classList.add(
            "list-group-item",
            "d-flex",
            "align-items-center",
            "justify-content-between"
        );

        // Container für Bild und Dateiname
        const leftContainer = document.createElement("div");
        leftContainer.classList.add("d-flex", "align-items-center");

            leftContainer.appendChild(img);



        const fileNameText = document.createElement("span");
        fileNameText.classList.add("fw-bold");
        fileNameText.textContent = filename;
        leftContainer.appendChild(fileNameText);

        // Container für die Buttons
        const rightContainer = document.createElement("div");
        rightContainer.appendChild(startBtn);
        rightContainer.appendChild(shareButton);
        rightContainer.appendChild(deleteButton);

        // Elemente zusammenfügen
        listItem.appendChild(leftContainer);
        listItem.appendChild(rightContainer);

        listContainer.appendChild(listItem);
    }
}

