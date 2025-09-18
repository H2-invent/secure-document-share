import express from "express";
import {writeFileSync} from "fs";
import {randomUUID} from "crypto";
import {fileURLToPath} from "url";
import {dirname, join} from "path";
import fs from "fs/promises";
import {Server} from 'socket.io';
import cors from "cors";
import "dotenv/config";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const UPLOAD_DIR = "./output/";
const app = express();
const PORT = 3000;
const version = process.env.APP_VERSION || 'not_set';
const slideshows = new Map();

console.log(`Running version: ${version}`);

app.use(express.static(join(__dirname, "dist")));

app.use(cors({
    origin: (origin, callback) => {
        callback(null, origin || "*"); // allow the requesting origin dynamically
    },
    credentials: true, // required for cookies
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));

app.get("/", (req, res) => {
    res.sendFile(join(__dirname, "dist", "index.html"));
});

app.get("/view/:docId", (req, res) => {
    const docId = req.params.docId;

    if (!docId) {
        return res.status(400).send("Fehlende Dokument-ID");
    }

    // Cookie mit der docId setzen (Gültigkeit: 1 Tag)
    res.cookie("docId", docId, {
        maxAge: 24 * 60 * 60 * 1000,
        httpOnly: true,
        sameSite: "none",
        secure: "false"
    });

    res.sendFile(join(__dirname, "dist", "view.html"));
});

app.get("/download/:docId", async (req, res) => {
    const {docId} = req.params;
    const filePath = join(__dirname, UPLOAD_DIR, `${docId}.bin`);

    try {
        const encryptedData = await fs.readFile(filePath);
        const parsedData = JSON.parse(encryptedData.toString());

        if (!parsedData.encryptedData || !parsedData.iv) {
            throw new Error("Invalid file format");
        }

        const encryptedArray = Uint8Array.from(Object.values(parsedData.encryptedData));
        const ivArray = Uint8Array.from(Object.values(parsedData.iv));

        res.json({encryptedArray: Array.from(encryptedArray), ivArray: Array.from(ivArray)});
    } catch (error) {
        console.error("Error loading file:", error);
        res.status(500).json({error: "Error retrieving file"});
    }
});

// Create WebSocket server
const server = app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
const io = new Server(server, {
    maxHttpBufferSize: 1e8, pingTimeout: 60000
});
const channels = new Map();

function handleJoin(socket, docId) {
    socket.join(docId);

    if (slideshows.get(docId)) {
        socket.emit('newImage', {'imageId': slideshows.get(docId), 'docId': docId});

    }

    socket.emit('joinSuccess', {message: 'Channel joined.'});
    console.log(`Client ${socket.id} joined channel ${docId}`);
}

io.on("connection", (socket) => {
    console.log(`Client ${socket.id} connected!`);
    let channelName = socket.handshake.query.channel ?? 'default';

    if (!channels.has(channelName)) {
        channels.set(channelName, {subscribers: new Set(), publishers: new Map(), docIds: new Set()});
    }

    const channel = channels.get(channelName);
    channel.subscribers.add(socket.id);

    if (channel.docIds.size > 0) {
        for (const docId of channel.docIds) {
            handleJoin(socket, docId);
        }
    }

    console.log("Channels:", channels);

    socket.emit('version', {version});

    socket.on("upload", async (data) => {
        console.log(`Upload received (page ${data.page})`);

        // The encrypted binary data is directly available
        const encryptedData = new Uint8Array(data.encrypted);
        const iv = new Uint8Array(data.iv);
        console.log(`Received binary data: ${encryptedData.length} bytes`);
        const id = randomUUID();
        const filePath = join(__dirname, UPLOAD_DIR, `${id}.bin`);

        writeFileSync(filePath, JSON.stringify({encryptedData, iv}));
        console.log(`Saved file: ${filePath}`);
        // Here you can save or further process the data
        socket.emit('saved', {id: id, page: data.page});

        console.log("Channels:", channels);
    });

    socket.on("startSlideshow", async (data) => {
        console.log(`Slideshow started with ID: ${data['docId']}`);

        channel.publishers.set(socket.id, data['docId']);
        channel.docIds.add(data['docId']);
        slideshows.set(data['docId'], '');
        socket.join(data['docId']);

        console.log("Channels:", channels);
    });

    socket.on("stopSlideshow", async (data) => {
        console.log(`Slideshow stopped with ID: ${data['docId']}`);

        io.to(data['docId']).emit('slideshowStopped', {'docId': data['docId']});

        slideshows.delete(data['docId']);
        channel.publishers.delete(socket.id);
        channel.docIds.delete(data['docId']);

        const roomSockets = io.sockets.adapter.rooms.get(data['docId']);
        if (roomSockets) {
            for (const socketId of roomSockets) {
                const clientSocket = io.sockets.sockets.get(socketId);
                if (clientSocket) {
                    clientSocket.leave(data['docId']);
                    console.log(`Client ${socketId} removed from channel ${data['docId']}`);
                }
            }
        }

        console.log("Channels:", channels);
    });

    socket.on("join", async (data) => {
        if (!slideshows.has(data['docId'])) {
            socket.emit('joinError', {message: 'Channel is not open.'});
            return;
        }

        handleJoin(socket, data['docId']);

        console.log("Channels:", channels);
    });

    socket.on("changeImage", async (data) => {
        console.log(`Image changed in channel ${data['docId']} to image ${data['imageId']}`);

        slideshows.set(data['docId'], data['imageId']);
        io.to(data['docId']).emit('newImage', {'imageId': data['imageId'], 'docId': data['docId']});

        console.log("Channels:", channels);
    })

    socket.on("pointerMove", async (data) => {
        io.to(data['docId']).emit('pointerMove', {'y': data['y'], 'x': data['x'], 'docId': data['docId']});

        // console.log(`Pointer moved in channel ${data['docId']} to x:${data['x']} y:${data['y']}`);
    })

    socket.on("pointerOut", async (data) => {
        io.to(data['docId']).emit('pointerOut', {'docId': data['docId']});

        // console.log(`Pointer moved in channel ${data['docId']} to x:${data['x']} y:${data['y']}`);
    })

    socket.on("pointerClick", async (data) => {
        io.to(data['docId']).emit('pointerClick', {'docId': data['docId']});

        // console.log(`Pointer moved in channel ${data['docId']} to x:${data['x']} y:${data['y']}`);
    })

    socket.on("disconnect", () => {
        console.log(`Client ${socket.id} disconnected`);

        channel.subscribers.delete(socket.id);

        if (channel.publishers.has(socket.id)) {
            const docId = channel.publishers.get(socket.id);

            io.to(docId).emit('slideshowStopped', {'docId': docId});
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