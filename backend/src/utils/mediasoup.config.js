import mediasoup from "mediasoup";

const workerSettings = {
  logLevel: 'warn',
  rtcMinPort: 10000,
  rtcMaxPort: 10100
};

let globalWorker = null;

export const createWorker = async () => {
  if (globalWorker) {
    return globalWorker;
  }

  globalWorker = await mediasoup.createWorker(workerSettings);

  globalWorker.on('died', () => {
    console.error('MediaSoup worker has died');
    globalWorker = null;
  });

  return globalWorker;
};
