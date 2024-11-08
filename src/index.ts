import express from "express";
import dotenv from "dotenv";
import route from "./routes/route";
import PRISMA from "./lib/pg"; 
import cors from 'cors'
dotenv.config();
const port = process.env.PORT || 3000;

const app = express();

app.use(express.json());
app.use(cors());
 
app.use("/api", route); 
(async () => {
  try {
    await PRISMA.DB.$connect();
    console.log("Database connected successfully");

    app.listen(port, () => {
      console.log("Server is running on port: " + port);
    });
  } catch (error) {
    console.error("Failed to connect to the database:", error);
    process.exit(1);
  }
})();
