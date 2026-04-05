import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createWorker } from "./utils/mediasoup.config.js";

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
        announcedAddress: process.env.MEDIASOUP_ANNOUNCED_IP || "127.0.0.1",
      },
      // TCP as fallback
      {
        protocol: "tcp",
        ip: process.env.MEDIASOUP_LISTEN_IP || "0.0.0.0",
        announcedAddress: process.env.MEDIASOUP_ANNOUNCED_IP || "127.0.0.1",
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
createWorker().then((w) => (worker = w));

const mediaCodecs = [
  {
    kind: "audio",
    mimeType: "audio/opus",
    clockRate: 48000,
    channels: 2,
  },
  {
    kind: "video",
    mimeType: "video/VP8",
    clockRate: 90000,
    parameters: {
      "x-google-start-bitrate": 1000,
    },
  },
];

io.on("connection", (socket) => {
  console.log("new User connection established : " + socket.id);

  socket.on("room:join", async ({ email, roomId }, callback) => {
    console.log(`User ${email} is joining room ${roomId}`);

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
        email: email,
        transports: [],
        producers: [],
        consumers: [],
      });

      callback({
        rtpCapabilities: roomState.router.rtpCapabilities,
      });
    } catch (error) {
      console.error("Error joining room:", error);
      callback({ error: "Failed to join room" });
    }
  });

  socket.on("createWebRtcTransport", async ({ roomId }, callback) => {
    try {
      const roomState = rooms.get(roomId);
      const router = roomState.router;

      // console.log("here begins debugging");
      // console.log("router :",router);
      // console.log("roomState: ",roomState);
      // console.log("roodId :",roomId);
      // console.log("rooms : ",rooms);

      const transport = await createWebRtcTransport(router);

      roomState.peers.get(socket.id).transports.push(transport);


      callback({
        params: {
          id: transport.id,
          iceParameters: transport.iceParameters,
          iceCandidates: transport.iceCandidates,
          dtlsParameters: transport.dtlsParameters,
        },
      });
    } catch (error) {
      console.error("Error creating transport:", error);
      callback({ error: error.message });
    }
  });

  socket.on(
    "transport:connect",
    async ({ roomId, transportId, dtlsParameters }, callback) => {
      try {
        const roomState = rooms.get(roomId);
        if (!roomState) throw new Error("Room not found");

        const peer = roomState.peers.get(socket.id);
        if (!peer) throw new Error("Peer not found");

        const transport = peer.transports.find((t) => t.id === transportId);
        if (!transport) throw new Error("Transport not found");

        await transport.connect({ dtlsParameters });

        callback();
      } catch (error) {
        console.error("Error connecting transport:", error);
        callback({ error: error.message });
      }
    },
  );

  socket.on(
    "transport:produce",
    async ({ roomId, transportId, kind, rtpParameters, appData }, callback) => {
      try {
        const roomState = rooms.get(roomId);
        if (!roomState) throw new Error("Room not found");

        const peer = roomState.peers.get(socket.id);
        if (!peer) throw new Error("Peer not found");

        const transport = peer.transports.find((t) => t.id === transportId);
        if (!transport) throw new Error("Transport not found");

        const producer = await transport.produce({
          kind,
          rtpParameters,
        });

        peer.producers.push(producer);

        producer.on("transportclose", () => {
          console.log("Producer transport closed");
          producer.close();
        });

        callback({ id: producer.id });

        roomState.peers.forEach((peerData, peerSocketId) => {
          if (peerSocketId !== socket.id) {
            io.to(peerSocketId).emit("new-producer", {
              producerId: producer.id,
              email:peer.email
            });
          }
        });
      } catch (error) {
        console.error("Error producing media:", error);
        callback({ error: error.message });
      }
    },
  );

  socket.on("close-producer", ({ roomId, producerId }) => {
    try {
      const roomState = rooms.get(roomId);
      if (!roomState) return;

      const peer = roomState.peers.get(socket.id);
      if (!peer) return;

      const producerIndex = peer.producers.findIndex(
        (p) => p.id === producerId,
      );

      if (producerIndex !== -1) {
        const producer = peer.producers[producerIndex];

        producer.close();

        peer.producers.splice(producerIndex, 1);

        console.log(`Closed producer ${producerId} for peer ${socket.id}`);
      }
    } catch (error) {
      console.error("Error closing producer:", error);
    }
  });

  socket.on("get-producers", ({ roomId }, callback) => {
    try {
      const roomState = rooms.get(roomId);
      if (!roomState) {
        return callback([]);
      }

      let producerList = [];

      roomState.peers.forEach((peer, peerSocketId) => {
        if (peerSocketId !== socket.id) {
          peer.producers.forEach((producer) => {
            producerList.push({
              producerId:producer.id,
              email:peer.email
            });
          });
        }
      });

      console.log(`Sending ${producerList.length} producers to ${socket.id}`);

      callback(producerList);
    } catch (error) {
      console.error("Error getting producers:", error);
      callback([]);
    }
  });

  socket.on(
    "consume",
    async ({ roomId, transportId, producerId, rtpCapabilities }, callback) => {
      try {
        const roomState = rooms.get(roomId);
        const peer = roomState.peers.get(socket.id);
        const transport = peer.transports.find((t) => t.id === transportId);

        if (!roomState.router.canConsume({ producerId, rtpCapabilities })) {
          console.error("Cannot consume this producer");
          return callback({ error: "Cannot consume" });
        }
        const consumer = await transport.consume({
          producerId: producerId,
          rtpCapabilities: rtpCapabilities,
          paused: true,
        });

        if (!peer.consumers) peer.consumers = [];
        peer.consumers.push(consumer);

        consumer.on("producerclose", () => {
          console.log(
            `Producer ${producerId} closed, closing consumer ${consumer.id}`,
          );
          consumer.close();

          socket.emit("consumer-closed", { consumerId: consumer.id });
        });

        callback({
          params: {
            id: consumer.id,
            producerId: consumer.producerId,
            kind: consumer.kind,
            rtpParameters: consumer.rtpParameters,
          },
        });
      } catch (error) {
        console.error("Error consuming media:", error);
        callback({ error: error.message });
      }
    },
  );
  
  socket.on("consumer-resume", async ({ roomId, consumerId }) => {
    try {
      const roomState = rooms.get(roomId);
      const peer = roomState.peers.get(socket.id);
      const consumer = peer.consumers.find((c) => c.id === consumerId);

      if (consumer) {
        await consumer.resume();
        console.log(`Resumed consumer ${consumerId}`);
      }
    } catch (error) {
      console.error("Error resuming consumer:", error);
    }
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected");

    for (const [roomId, roomState] of rooms.entries()) {
      if (roomState.peers.has(socket.id)) {
        const peer = roomState.peers.get(socket.id);

        if (peer.transports) {
          peer.transports.forEach((transport) => transport.close());
        }

        roomState.peers.delete(socket.id);
        console.log(`Cleaned up peer ${socket.id} from room ${roomId}`);

        if (roomState.peers.size === 0) {
          roomState.router.close();
          rooms.delete(roomId);
          console.log(`Room ${roomId} is empty and has been deleted.`);
        }

        break;
      }
    }
  });
});

export { io, httpServer, app };
