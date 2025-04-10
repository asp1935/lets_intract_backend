import mongoose from "mongoose";

const connectDB=async()=>{
    try {
        const connectionInstance=await mongoose.connect(`${process.env.MONGODB_URI}/${process.env.DB_NAME}`);
        console.log(`MONGODB CONNECTED !! DB Host: ${connectionInstance.connection.host}`);
        
    } catch (error) {
        console.log("MONGODB CONECTION ERROR",error);
        //process is like our app is running on one process & this is refrence of that process
        //this exit method terminate process
        process.exit(1);
    }
}

export default connectDB;