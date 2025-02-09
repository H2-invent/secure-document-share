export async function generateKey() {
    return await crypto.subtle.generateKey(
        { name: "AES-GCM", length: 256 },
        true,
        ["encrypt", "decrypt"]
    );
}

export async function encryptData(data, key) {
    const iv = crypto.getRandomValues(new Uint8Array(16));
    const encrypted = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        key,
        data
    );
    return { encrypted, iv };
}

export async function decryptData(encryptedData,iv, key) {

    const cryptoKey = await importKey(key);
try {
    const decryptedArrayBuffer = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: iv },
        cryptoKey,
        encryptedData
    );
    return new Blob([decryptedArrayBuffer], { type: "image/png" });
}catch (e){
    console.log(e);
}



}

export async function exportKey(key) {
    const exported = await window.crypto.subtle.exportKey("raw", key);
    return btoa(String.fromCharCode(...new Uint8Array(exported)));
}

export async function importKey(base64Key) {
    const raw = Uint8Array.from(atob(base64Key), c => c.charCodeAt(0));
    return window.crypto.subtle.importKey(
        "raw",
        raw,
        { name: "AES-GCM" },
        true,
        ["encrypt", "decrypt"]
    );
}
