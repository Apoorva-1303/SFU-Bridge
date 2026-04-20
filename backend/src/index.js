import "dotenv/config";

import { httpServer } from "./app.js";
import { createWorker } from "./utils/mediasoup.config.js";

const PORT = parseInt(process.env.SERVER_PORT) || 3000;

createWorker()
  .then(() => {
    httpServer.listen(PORT, () => {
      console.log(`Server is running and listening on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to initialize Mediasoup:", err);
  });
