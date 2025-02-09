import express from "express";
import { WebSocketServer } from "ws";
import { writeFileSync, readFileSync, unlinkSync, existsSync } from "fs";
import { randomUUID } from "crypto";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import fs from "fs/promises";
import { Server } from 'socket.io';
import cookie from "cookie";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const UPLOAD_DIR = "./output/";
const app = express();
const PORT = 3000;

export const slideshows = new Map();
// Statische Dateien aus "public/" bereitstellen
app.use(express.static(join(__dirname, "dist")));

// WebSocket-Server erstellen
const server = app.listen(PORT, () => console.log(`🚀 Server läuft auf http://localhost:${PORT}`));
const io = new Server(server);

app.get("/download/:docId", async (req, res) => {
    const { docId } = req.params;
    const filePath = join(__dirname, UPLOAD_DIR, `${docId}.bin`);

    try {
        const encryptedData = await fs.readFile(filePath);

        // Die Datei enthält ein JSON-Objekt mit verschlüsselten Daten und IV
        const parsedData = JSON.parse(encryptedData.toString());

        if (!parsedData.encryptedData || !parsedData.iv) {
            throw new Error("Ungültiges Dateiformat");
        }

        const encryptedArray = Uint8Array.from(Object.values(parsedData.encryptedData));
        const ivArray = Uint8Array.from(Object.values(parsedData.iv));

        res.json({ encryptedArray: Array.from(encryptedArray), ivArray: Array.from(ivArray) });
    } catch (error) {
        console.error("Fehler beim Laden der Datei:", error);
        res.status(500).json({ error: "Fehler beim Abrufen der Datei" });
    }
});

app.get("/", (req, res) => {
    res.sendFile(join(__dirname, "dist", "index.html"));
});
app.get("/view/:docId", (req, res) => {
    const docId = req.params.docId;

    if (!docId) {
        return res.status(400).send("Fehlende Dokument-ID");
    }

    // Cookie mit der docId setzen (Gültigkeit: 1 Tag)
    res.cookie("docId", docId, { maxAge: 24 * 60 * 60 * 1000, httpOnly: true });

    res.sendFile(join(__dirname, "dist", "view.html"));
});



io.on("connection", (socket) => {
    console.log("Client verbunden!");
    const cookies = cookie.parse(socket.handshake.headers.cookie || "");
    const docId = cookies.docId;

    if (docId) {
        socket.join(docId);
        console.log(`👤 Client ${socket.id} ist automatisch dem Raum ${docId} beigetreten`);
        console.log(slideshows);
        socket.emit('newImage',{'imageId':slideshows.get(docId), 'docId': docId});
    } else {
        console.log(`⚠️ Kein docId-Cookie für Client ${socket.id} gefunden`);
    }

    socket.on("upload", async (data) => {
        console.log(`📥 Upload empfangen (Seite ${data.page})`);

        // Die verschlüsselten Binärdaten sind direkt verfügbar
        const encryptedData = new Uint8Array(data.encrypted);
        const iv = new Uint8Array(data.iv);
        console.log(`Binärdaten erhalten: ${encryptedData.length} Bytes`);
        const id = randomUUID();
        const filePath = join(__dirname, UPLOAD_DIR, `${id}.bin`);

        writeFileSync(filePath, JSON.stringify({encryptedData,iv }));
        console.log(`📁 Gespeicherte Datei: ${filePath}`);
        // Hier kannst du die Daten speichern oder weiterverarbeiten
        socket.emit('saved',{id:id});
    });

    socket.on("startSlideshow", async (data) => {
        slideshows.set(data['docId'],'');
        socket.join(data['docId']);
    })

    socket.on("joinRoom", (docId) => {
        socket.join(docId);
        console.log(`👤 Client ${socket.id} ist dem Raum ${docId} beigetreten`);
    });

    socket.on("changeImage", async (data) => {
        slideshows.set(data['docId'],data['imageId']);
        io.to(data['docId']).emit('newImage',{'imageId':data['imageId'],'docId': data['docId']});
    })

    socket.on("disconnect", () => {
        console.log("Client getrennt.");
    });
});


//
// // WebSocket-Handling
// wss.on("connection", ws => {
//
//
//     ws.on("message", async data => {
//         const message = JSON.parse(data);
// // R-AS 2599 hat auf der autobahn gedrängelt. Ups ich glaube, ich habe den Kommentar vergessen
//
//         if (message.action === "upload") {
//             const { page, iv, encrypted } = message;
//             console.log(message);
//             const id = randomUUID();
//             const filePath = join(__dirname, UPLOAD_DIR, `${id}.bin`);
//
//             writeFileSync(filePath, JSON.stringify({encrypted }));
//             console.log(`📁 Gespeicherte Datei: ${filePath}`);
//
//             ws.send(JSON.stringify({ action: "saved", id }));
//             return;
//         }
//
//         if (message.action === "retrieve") {
//             const filePath = join(__dirname, "output", `${message.id}.bin`);
//             if (existsSync(filePath)) {
//                 const fileData = JSON.parse(readFileSync(filePath));
//                 ws.send(JSON.stringify({
//                     action: "retrieve",
//                     id: message.id,
//                     encrypted: fileData.encrypted,
//                     iv: fileData.iv
//                 }));
//             }
//             return;
//         }
//
//         if (message.action === "delete") {
//             const filePath = join(__dirname, "output", `${message.id}.bin`);
//             if (existsSync(filePath)) {
//                 unlinkSync(filePath);
//                 console.log(`🗑️ Datei ${filePath} gelöscht`);
//             }
//             return;
//         }
//     });
//
//     ws.on("close", () => console.log("Client getrennt"));
// });
