import { useCallback, useEffect, useState, useLocation, useParams } from "react";
import { useSocket } from "../contexts/SocketContext";
import { useNavigate } from "react-router-dom";
import {Device} from "mediasoup-client";

const RoomPage = () => {
  const socket = useSocket();
  const navigate = useNavigate();
  const [device,setDevice] = useState(null);
  const { roomId } = useParams();
  const location = useLocation();
  const email = location.state?.email;
  const [producerTransport, setProducerTransport] = useState(null);
  const [consumerTransport, setConsumerTransport] = useState(null);
  // CHANGE: later switch this with session to keep email cuz on refresh its gonna vanish

  const initiateSendTransport = useCallback((loadedDevice) => {
    socket.emit("createWebRtcTransport", { roomId }, async ({ params, error }) => {
      if (error) {
        console.error(error);
        return;
      }

      const transport = loadedDevice.createSendTransport(params);

      transport.on('connect', async ({ dtlsParameters }, callback, errback) => {
        try {
          socket.emit('transport:connect', { 
            roomId: roomId,
            transportId: transport.id,
            dtlsParameters 
          }, () => {
            callback(); 
          });
        } catch (error) {
          errback(error); 
        }
      });

      transport.on('produce', async (parameters, callback, errback) => {
        try {
          socket.emit('transport:produce', {
            roomId:roomId,
            transportId:transport.id,
            kind: parameters.kind,
            rtpParameters: parameters.rtpParameters,
            appData: parameters.appData,
          }, ({ id, error }) => {
            if (error) {
              errback(error);
              return;
            }
            callback({ id }); 
          });
        } catch (error) {
          errback(error);
        }
      });

      setProducerTransport(transport);
      console.log('Send transport created on client!');
    });
  },[socket, roomId]);

  const initiateRecvTransport = useCallback((loadedDevice) => {
    socket.emit("createWebRtcTransport", { roomId }, async ({ params, error }) => {
      if (error) {
        console.error(error);
        return;
      }
      
      const recvTransport = loadedDevice.createRecvTransport(params);
      
      recvTransport.on('connect', async ({ dtlsParameters }, callback, errback) => {
        try {
          socket.emit('transport:connect', { 
            roomId: roomId,
            transportId: recvTransport.id,
            dtlsParameters 
          }, () => {
            callback(); 
          });
        } catch (error) {
          errback(error); 
        }
      });

      setConsumerTransport(recvTransport);
      console.log('Receive transport created on client!');
    });
  },[roomId, socket]);

  useEffect(()=>{
    if (!email) {
      console.log("No email found, redirecting to lobby...");
      navigate('/');
      return;
    }

    socket.emit("room:join",{email,roomId}, async (response) => {
      if (response.error) {
        console.error(response.error);
        return;
      }

      try {
        const newDevice = new Device();

        await newDevice.load({ 
          routerRtpCapabilities: response.rtpCapabilities 
        });

        console.log('Mediasoup device loaded successfully!');

        if (!newDevice.canProduce('video')) {
          console.log('This browser cannot produce video');
        }

        setDevice(newDevice);

        initiateSendTransport(newDevice);

        initiateRecvTransport(newDevice);
      } catch (error) {
        if (error.name === 'UnsupportedError') {
          console.error('Browser is not supported by Mediasoup');
        } else {
          console.error('Failed to load device:', error);
        }
      }
    });
  },[email, roomId, socket, navigate, initiateSendTransport, initiateRecvTransport]);

  
  
  return (
    <div>
      <h1>Room page</h1>
      {/* <h4>{remoteSocketId ? "You are connected" : "No one in the room"}</h4>
      {remoteSocketId && <button onClick={handleCallUser}>Call</button>}
      {myStream && <button onClick={sendStreams}>Send Streams</button>}

      {myStream && (
        <div>
          <h3>My Stream</h3>
          <video
            style={{
              width: "200px",
              height: "100px",
              backgroundColor: "black",
            }}
            autoPlay
            muted
            playsInline
            ref={(video) => {
              if (video && myStream) {
                video.srcObject = myStream;
              }
            }}
          />
        </div>
      )}

      {remoteStream && (
        <div>
          <h3>Remote Stream</h3>
          <video
            style={{
              width: "200px",
              height: "100px",
              backgroundColor: "black",
            }}
            autoPlay
            muted
            playsInline
            ref={(video) => {
              if (video && remoteStream) {
                video.srcObject = remoteStream;
              }
            }}
          />
        </div>
      )} */}
    </div>
  );
};
export default RoomPage;
