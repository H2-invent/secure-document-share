import {deleteDocumentFromLocalStorage, getDocumentsFromLocalStorage} from "./db.mjs";
import {decryptData, importKey} from "./encryption.mjs";
import {downloadImage} from "./downloadImage.mjs";
import {loadSlideshow} from "./startSlideshow.mjs";

const listContainer = document.getElementById("documentList");

export async function loadDocumentPreviews() {

    listContainer.innerHTML = ""; // Reset Liste

    const documents = getDocumentsFromLocalStorage();

    for (const docId in documents) {
        const {filename, exportedKey, uploadIds} = documents[docId];


        const decryptedBlob = await downloadImage(uploadIds[0], exportedKey)

        // Bild im UI anzeigen
        const img = document.createElement("img");
        img.src = URL.createObjectURL(decryptedBlob);
        img.classList.add('pointer');
        img.alt = filename;
        img.style.width = "100px";
        img.addEventListener('click', (event) => {
            loadSlideshow(docId);
        })
        // Löschbutton erstellen
        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Löschen";
        deleteButton.classList.add("btn", "btn-primary", "btn-sm", "mt-2");
        deleteButton.addEventListener("click", () => {
            deleteDocumentFromLocalStorage(docId);
            loadDocumentPreviews(); // Aktualisiert die Liste
        });
        const encodedKey = btoa(exportedKey).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

        const shareLink = document.createElement("a");
        shareLink.href = `${window.location.origin}/view/${docId}#key=${encodedKey}`;
        shareLink.textContent = "Teilen";
        shareLink.classList.add("btn", "btn-primary", "btn-sm", "mt-2");
        shareLink.setAttribute("target", "_blank");
        const shareLinkText = document.createElement('p');
        shareLinkText.textContent = `${window.location.origin}/view/${docId}#key=${encodedKey}`;



        const listItem = document.createElement("li");
        listItem.classList.add("list-group-item", "d-flex","flex-column", "align-items-start");
        listItem.textContent = filename;
        listItem.appendChild(img);
        listItem.appendChild(deleteButton);
        listItem.appendChild(shareLink);
        listItem.appendChild(shareLinkText);

        listContainer.appendChild(listItem);
    }
}
