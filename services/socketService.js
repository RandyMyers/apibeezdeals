const { parseClientOrigins } = require("../config/corsOrigins");

/** Socket.IO for admin live visitor feed. */
let adminNamespace = null;

function initSocket(server) {
  const { Server } = require("socket.io");
  const origins = parseClientOrigins(process.env.CLIENT_ORIGIN);

  const io = new Server(server, {
    cors: {
      origin: origins,
      methods: ["GET", "POST"],
      credentials: true,
    },
    path: "/socket.io",
  });

  adminNamespace = io.of("/admin");

  adminNamespace.on("connection", (socket) => {
    socket.emit("connected", { message: "Connected to live activity feed" });
  });

  return { io, adminNamespace };
}

function emitToAdmin(event, data) {
  if (!adminNamespace) return;
  try {
    adminNamespace.emit(event, data);
  } catch (e) {
    console.warn("Socket emit failed:", e.message);
  }
}

module.exports = { initSocket, emitToAdmin };
