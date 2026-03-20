import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { SocketIdToEmail, EmailToSocketId } from "./utils/Mapping.js";

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

app.get("/", (req, res) => {
  res.send("hello");
});

io.on("connection", (socket) => {
  console.log("new User connection established : " + socket.id);

  socket.on("room:join", (data) => {
    const { email, room } = data;
    EmailToSocketId.set(email, socket.id);
    SocketIdToEmail.set(socket.id, email);
    io.to(room).emit("user:joined",{email,id:socket.id});
    socket.join(room);
    io.to(socket.id).emit("room:join", data);
  });

  socket.on("user:call",({to,offer})=>{
    io.to(to).emit("incoming:call",{from:socket.id,offer});
  });

  socket.on("call:accepted",({to,answer})=>{
    io.to(to).emit("call:accepted",{from:socket.id,answer});
  });

  socket.on("peer:nego:needed",({to,offer})=>{
    io.to(to).emit("peer:nego:needed",{from:socket.id,offer});
  });

  socket.on("peer:nego:done",({to,answer})=>{
    io.to(to).emit("peer:nego:final",{from:socket.id,answer});
  });
});

export { io, httpServer, app };
