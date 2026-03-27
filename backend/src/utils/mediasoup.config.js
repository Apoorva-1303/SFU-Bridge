import mediasoup from "mediasoup";

const workerSettings = {
  logLevel: 'warn',
  rtcMinPort: 10000,
  rtcMaxPort: 10100
};


const createWorker = async () => {
  let worker = await mediasoup.createWorker(workerSettings);
  worker.on('died', () => {
    console.error('MediaSoup worker has died');
  });

  return worker;
};

module.exports = { createWorker};
