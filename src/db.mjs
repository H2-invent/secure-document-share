import {exportKey} from "./encryption.mjs";
export async function checkDB(){
    try {
        localStorage.setItem('dummyData',true);
    }catch (e) {
        document.getElementById('dropZone').remove();
        document.getElementById('errorMessage').textContent='Bitte aktivieren Sie Third Party Cookies, damit Sie LookyLooky in einem Iframe verwenden können.';
    }

}
export async function saveDocumentToLocalStorage(filename, key, uploadIds) {
    const db = JSON.parse(localStorage.getItem("pdfDB")) || {};
    const exportedKey = await exportKey(key);
    const docId = generateUUID(); // Neue eindeutige ID für das Dokument

    db[docId] = { filename, exportedKey, uploadIds };
    localStorage.setItem("pdfDB", JSON.stringify(db));
}

export function getDocumentsFromLocalStorage() {
    return JSON.parse(localStorage.getItem("pdfDB")) || {};
}
export function findDataById(id) {
    const db = getDocumentsFromLocalStorage();
    return db[id];
}
export function updateDocumentListUI() {
    const list = document.getElementById("documentList");
    list.innerHTML = ""; // Reset Liste
    const documents = getDocumentsFromLocalStorage();

    for (const filename in documents) {
        const item = document.createElement("li");
        item.textContent = filename;
        item.onclick = () => loadDocumentImages(filename);
        list.appendChild(item);
    }
}
function generateUUID() {
    return crypto.randomUUID(); // Erstellt eine eindeutige ID
}
export function deleteDocumentFromLocalStorage(docId) {
    const db = getDocumentsFromLocalStorage();
    delete db[docId];
    localStorage.setItem("pdfDB", JSON.stringify(db));
}
