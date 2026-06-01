import mongoose from "mongoose";

const connectDB = async() =>{
  try{
    const mongoURI = process.env.MONGO_URI;

    if (!mongoURI) {
      throw new Error("MongoDB environment variables are missing!");
    }

    await mongoose.connect(mongoURI);
    console.log('Successfully connected to database ');

  }catch(err){

    console.log('Database Connection Error: ', err);
    throw err;

  }
}

export default connectDB;