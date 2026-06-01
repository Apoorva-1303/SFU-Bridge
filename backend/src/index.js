import "dotenv/config";
import connectDB from "./db/database.connect.js"
import { httpServer } from "./app.js";
import { createWorker } from "./utils/mediasoup.config.js";

const PORT = parseInt(process.env.SERVER_PORT) || 3000;

try {
  await Promise.all([
    connectDB(),
    createWorker()
  ]);
  
  console.log("Database and Mediasoup initialized successfully.");

  httpServer.listen(PORT, () => {
    console.log(`Server is running and listening on port ${PORT}`);
  });
} catch (err) {
  console.error("Critical failure during server startup:", err);
  process.exit(1); 
}
