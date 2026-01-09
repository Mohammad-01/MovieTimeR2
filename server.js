import express from "express";
import http from "http";
import { Server } from "socket.io";
import path from "path";
import QRCode from "qrcode";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// 📁 قدّم ملفات public
app.use(express.static(path.join(__dirname, "public")));

// 🧠 rooms storage
const rooms = {};

// ================= SOCKET =================
io.on("connection", (socket) => {
  console.log("🟢 Connected:", socket.id);

  // شاشة العرض (البروجكتر)
  socket.on("join-display", async () => {
    const room = "cinema-room";
    rooms[room] = { display: socket.id };

    socket.join(room);

    const controllerUrl = `http://192.168.1.65:3000/?mode=controller&room=${room}`;
    const qr = await QRCode.toDataURL(controllerUrl);

    socket.emit("display-ready", { room, qr });

    console.log("🖥 Display joined:", room);
  });

  // الموبايل (الريموت)
  socket.on("join-controller", ({ room }) => {
    socket.join(room);
    console.log("📱 Controller joined:", room);
  });

  // اختيار فيلم من الموبايل
  socket.on("select-movie", ({ room, movieId }) => {
    console.log("🎬 Movie selected:", movieId);
    io.to(room).emit("play-movie", { movieId });
  });

  socket.on("disconnect", () => {
    console.log("🔴 Disconnected:", socket.id);
  });
});

// ================= START =================
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
