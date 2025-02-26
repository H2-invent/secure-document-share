import {decryptData} from "./encryption.mjs";

export async function downloadImage(id, key)
{
    const response = await fetch(`/download/${id}`);
    if (!response.ok) {
        console.error(`❌ Fehler beim Laden der Datei für ${id}`);
        throw new Error('faild fetchin image');
    }

    const {encryptedArray, ivArray} = await response.json();

    const encryptedData = new Uint8Array(encryptedArray);
    const iv = new Uint8Array(ivArray);

    return await decryptData(encryptedData, iv, key);
}