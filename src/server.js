import http from "node:http";
import { Server } from "socket.io";
import { app, sessionMiddleware } from "./app.js";
import { env } from "./config/env.js";
import { setSocketServer } from "./lib/socket.js";

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: true,
    credentials: true
  }
});

setSocketServer(io);

io.engine.use(sessionMiddleware);

io.on("connection", (socket) => {
  socket.on("admin:join", () => {
    if (socket.request.session?.user?.isAdmin) {
      socket.join("admin");
    }
  });
});

server.listen(env.port, () => {
  console.log(`Кондитерская запущена: http://localhost:${env.port}`);
});
