import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

app.get('/',(req,res)=>{
  res.send("hello");
})

io.on("connection", (socket) => {
  console.log("new User connection established : " + socket.id);
});

const port = parseInt(process.env.SERVER_PORT)||3000;
httpServer.listen(port,()=>{
  console.log(`Server running on port ${port}`)
});