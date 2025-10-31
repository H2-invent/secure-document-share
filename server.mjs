import express from "express";
import { randomUUID } from "crypto";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import fs from "fs/promises";
import { Server } from "socket.io";
import cors from "cors";
import "dotenv/config";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const UPLOAD_DIR = "./data/";
const app = express();
const DEFAULT_PORT = 3000;
const argPort = process.argv.find(arg => arg.startsWith("--port="));
const PORT = argPort ? parseInt(argPort.split("=")[1], 10) : (process.env.PORT || DEFAULT_PORT);
const version = process.env.APP_VERSION || "not_set";
const slideshows = new Map();

console.log(`Running version: ${version}`);

app.use(express.static(join(__dirname, "dist")));

app.use(
    cors({
        origin: (origin, callback) => callback(null, origin || "*"),
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
    })
);

app.get("/download/:docId", async (req, res) => {
    const { docId } = req.params;
    const filePath = join(__dirname, UPLOAD_DIR, `${docId}.bin`);
    try {
        const encryptedData = await fs.readFile(filePath);
        const parsedData = JSON.parse(encryptedData.toString());
        if (!parsedData.encryptedData || !parsedData.iv) throw new Error("Invalid file format");
        const encryptedArray = Uint8Array.from(Object.values(parsedData.encryptedData));
        const ivArray = Uint8Array.from(Object.values(parsedData.iv));
        res.json({ encryptedArray: Array.from(encryptedArray), ivArray: Array.from(ivArray) });
    } catch (error) {
        console.error("Error loading file:", error);
        res.status(500).json({ error: "Error retrieving file" });
    }
});

// app.get("/delete/:docId", async (req, res) => {
//     const { docId } = req.params;
//     const filePath = join(__dirname, UPLOAD_DIR, `${docId}.bin`);
//     try {
//         await fs.unlink(filePath);
//         res.json({ success: true, message: `File ${docId}.bin deleted.` });
//     } catch (error) {
//         console.error("Error deleting file:", error);
//         res.status(404).json({ success: false, error: "File not found or could not be deleted." });
//     }
// });

const server = app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
const io = new Server(server, { maxHttpBufferSize: 1e8, pingTimeout: 60000 });
const channels = new Map();

function handleJoin(socket, docId) {
    socket.join(docId);
    if (slideshows.has(docId)) {
        socket.emit("newImage", { imageId: slideshows.get(docId), docId });
    }
    socket.emit("joinSuccess", { docId });
    console.log(`Client ${socket.id} joined channel ${docId}`);
}

io.on("connection", (socket) => {
    console.log(`Client ${socket.id} connected!`);
    const channelName = socket.handshake.query.channel ?? "default";
    if (!channels.has(channelName)) {
        channels.set(channelName, { subscribers: new Set(), publishers: new Map(), docIds: new Set() });
    }
    const channel = channels.get(channelName);
    channel.subscribers.add(socket.id);

    if (channel.docIds.size > 0) {
        for (const docId of channel.docIds) handleJoin(socket, docId);
    }

    console.log("Channels:", channels);
    socket.emit("version", { version });

    socket.on("upload", async (data) => {
        try {
            console.log(`Upload received (page ${data.page})`);
            const encryptedData = new Uint8Array(data.encrypted);
            const iv = new Uint8Array(data.iv);
            const id = randomUUID();
            const filePath = join(__dirname, UPLOAD_DIR, `${id}.bin`);
            await fs.writeFile(filePath, JSON.stringify({ encryptedData, iv }));
            console.log(`Saved file: ${filePath}`);
            socket.emit("saved", { id, page: data.page });
        } catch (err) {
            console.error("Upload error:", err);
            socket.emit("error", { message: "Upload failed" });
        }
        console.log("Channels:", channels);
    });

    socket.on("startSlideshow", (data) => {
        const { docId, imageId } = data;
        console.log(`Slideshow started with ID: ${docId}`);
        channel.publishers.set(socket.id, docId);
        channel.docIds.add(docId);
        slideshows.set(docId, imageId);
        socket.join(docId);
        console.log("Channels:", channels);
    });

    socket.on("stopSlideshow", (data) => {
        const { docId } = data;
        console.log(`Slideshow stopped with ID: ${docId}`);
        io.to(docId).emit("slideshowStopped", { docId });
        slideshows.delete(docId);
        channel.publishers.delete(socket.id);
        channel.docIds.delete(docId);
        const roomSockets = io.sockets.adapter.rooms.get(docId);
        if (roomSockets) {
            for (const socketId of roomSockets) {
                const clientSocket = io.sockets.sockets.get(socketId);
                if (clientSocket) {
                    clientSocket.leave(docId);
                    console.log(`Client ${socketId} removed from channel ${docId}`);
                }
            }
        }
        console.log("Channels:", channels);
    });

    socket.on("join", (data) => {
        const { docId } = data;
        if (!slideshows.has(docId)) {
            socket.emit("joinError", { message: "Channel is not open." });
            return;
        }
        handleJoin(socket, docId);
        console.log("Channels:", channels);
    });

    socket.on("changeImage", (data) => {
        const { docId, imageId } = data;
        console.log(`Image changed in channel ${docId} to image ${imageId}`);
        slideshows.set(docId, imageId);
        io.to(docId).emit("newImage", { imageId, docId });
        console.log("Channels:", channels);
    });

    socket.on("pointerMove", (data) => {
        const { docId, x, y } = data;
        io.to(docId).emit("pointerMove", { x, y, docId });
    });

    socket.on("pointerOut", (data) => {
        const { docId } = data;
        io.to(docId).emit("pointerOut", { docId });
    });

    socket.on("pointerClick", (data) => {
        const { docId } = data;
        io.to(docId).emit("pointerClick", { docId });
    });

    socket.on("disconnect", () => {
        console.log(`Client ${socket.id} disconnected`);
        channel.subscribers.delete(socket.id);
        if (channel.publishers.has(socket.id)) {
            const docId = channel.publishers.get(socket.id);
            io.to(docId).emit("slideshowStopped", { docId });
            channel.docIds.delete(docId);
            channel.publishers.delete(socket.id);
            slideshows.delete(docId);
        }
        if (channel.subscribers.size === 0) {
            channels.delete(channelName);
            console.log(`Channel ${channelName} removed from channels due to no subscribers`);
        }
        console.log("Channels:", channels);
    });
});