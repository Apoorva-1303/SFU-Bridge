import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createWorker } from "./utils/mediasoup.config";

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

app.get("/", (req, res) => {
  res.send("hello");
});

const createWebRtcTransport = async (router) => {
  const webRtcTransport_options = {
    listenInfos: [
      // UDP we prefer
      {
        protocol: "udp",
        ip: process.env.MEDIASOUP_LISTEN_IP || "0.0.0.0",
        ...(process.env.MEDIASOUP_ANNOUNCED_IP && {
          announcedAddress: process.env.MEDIASOUP_ANNOUNCED_IP,
        }),
      },
      // TCP as fallback
      {
        protocol: "tcp",
        ip: process.env.MEDIASOUP_LISTEN_IP || "0.0.0.0",
        ...(process.env.MEDIASOUP_ANNOUNCED_IP && {
          announcedAddress: process.env.MEDIASOUP_ANNOUNCED_IP,
        }),
      },
    ],
    initialAvailableOutgoingBitrate: 1000000,
  };

  const transport = await router.createWebRtcTransport(webRtcTransport_options);

  transport.on("dtlsstatechange", (dtlsState) => {
    if (dtlsState === "closed") {
      transport.close();
    }
  });

  transport.on("close", () => {
    console.log("Transport closed");
  });

  return transport;
};


const rooms = new Map();
let worker;
createWorker().then(w => worker = w);

const mediaCodecs = [
  {
    kind: 'audio',
    mimeType: 'audio/opus',
    clockRate: 48000,
    channels: 2,
  },
  {
    kind: 'video',
    mimeType: 'video/VP8',
    clockRate: 90000,
    parameters: {
      'x-google-start-bitrate': 1000,
    },
  },
];

io.on("connection", (socket) => {
  console.log("new User connection established : " + socket.id);

  socket.on('join:room', async ({ name, roomId }, callback) => {
    console.log(`User ${name} is joining room ${roomId}`);

    socket.join(roomId);

    try {
      if (!rooms.has(roomId)) {
        const router = await worker.createRouter({ mediaCodecs });
        
        rooms.set(roomId, {
          router: router,
          peers: new Map(), // We'll store connected users here 
        });
        console.log(`Created new Router for room ${roomId}`);
      }

      const roomState = rooms.get(roomId);
      
      roomState.peers.set(socket.id, {
        name: name,
        transports: [],
        producers: [],
        consumers: []
      });

      callback({
        rtpCapabilities: roomState.router.rtpCapabilities
      });

    } catch (error) {
      console.error('Error joining room:', error);
      callback({ error: 'Failed to join room' });
    }
  });

  socket.on('createWebRtcTransport', async ({ roomId }, callback) => {
    try {
      const roomState = rooms.get(roomId);
      const router = roomState.router;

      const transport = createWebRtcTransport(router);

      roomState.peers.get(socket.id).transports.push(transport);

      callback({
        params: {
          id: transport.id,
          iceParameters: transport.iceParameters,
          iceCandidates: transport.iceCandidates,
          dtlsParameters: transport.dtlsParameters,
        }
      });

    } catch (error) {
      console.error('Error creating transport:', error);
      callback({ error: error.message });
    }
  });

  socket.on('transport:connect', async ({ roomId, transportId, dtlsParameters }, callback) => {
    try {
      const roomState = rooms.get(roomId); 
      if (!roomState) throw new Error('Room not found');

      const peer = roomState.peers.get(socket.id);
      if (!peer) throw new Error('Peer not found');
      
      const transport = peer.transports.find(t => t.id === transportId); 
      if (!transport) throw new Error('Transport not found');

      await transport.connect({ dtlsParameters });

      callback(); 
    } catch (error) {
      console.error('Error connecting transport:', error);
      callback({ error: error.message });
    }
  });

  socket.on('transport:produce', async ({ roomId, transportId, kind, rtpParameters, appData }, callback) => {
    try {
      const roomState = rooms.get(roomId); 
      if (!roomState) throw new Error('Room not found');

      const peer = roomState.peers.get(socket.id);
      if (!peer) throw new Error('Peer not found');
      
      const transport = peer.transports.find(t => t.id === transportId); 
      if (!transport) throw new Error('Transport not found');

      const producer = await transport.produce({
        kind,
        rtpParameters,
      });

      peer.producers.push(producer);

      producer.on('transportclose', () => {
        console.log('Producer transport closed');
        producer.close();
      });

      callback({ id: producer.id });
    } catch (error) {
      console.error('Error producing media:', error);
      callback({ error: error.message });
    }
  });

  socket.on('close-producer', ({ roomId, producerId }) => {
    try {
      const roomState = rooms.get(roomId);
      if (!roomState) return;

      const peer = roomState.peers.get(socket.id);
      if (!peer) return;

      const producerIndex = peer.producers.findIndex(p => p.id === producerId);
      
      if (producerIndex !== -1) {
        const producer = peer.producers[producerIndex];
        
        producer.close();
        
        peer.producers.splice(producerIndex, 1);
        
        console.log(`Closed producer ${producerId} for peer ${socket.id}`);
      }
      // TODO : emit to others to shut their consumers for this producer
    } catch (error) {
      console.error('Error closing producer:', error);
    }
  });

  




  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });

  

  // socket.on("user:call", ({ to, offer }) => {
  //   io.to(to).emit("incoming:call", { from: socket.id, offer });
  // });

  // socket.on("call:accepted", ({ to, answer }) => {
  //   io.to(to).emit("call:accepted", { from: socket.id, answer });
  // });

  // socket.on("peer:nego:needed", ({ to, offer }) => {
  //   io.to(to).emit("peer:nego:needed", { from: socket.id, offer });
  // });

  // socket.on("peer:nego:done", ({ to, answer }) => {
  //   io.to(to).emit("peer:nego:final", { from: socket.id, answer });
  // });
});

export { io, httpServer, app };
