import { httpServer } from './app.js'
import dotenv from 'dotenv'
dotenv.config()

const port = parseInt(process.env.SERVER_PORT)||3000;

httpServer.listen(port,()=>{
  console.log(`Server running on port ${port}`)
});