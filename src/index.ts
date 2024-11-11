import express, { Request, Response } from "express";
import dotenv from "dotenv";
import route from "./routes/route";
import PRISMA from "./lib/pg";
import cors from "cors";
import asyncHandler from "express-async-handler";

dotenv.config();
const port = process.env.PORT || 4444;

const app = express();

app.use(express.json());
app.use(cors());

// Define the redirectLink function with explicit Promise<void> return type
const redirectLink = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { short_url } = req.params;

    // Find the original URL in the database based on the short URL code
    const link = await PRISMA.DB.link.findUnique({
      where: { shortUrl: short_url }, // Ensure "shortUrl" matches your database field
    });

    if (!link) {
      // If the short link doesn't exist, respond with a 404 error
      res.status(404).json({ error: "Short link not found" });
      return; // Explicitly return to avoid further execution
    }

    // Redirect to the original URL without returning the res.redirect() call

    await PRISMA.DB.link.update({
      where: { shortUrl: short_url },
      data: { lastAccessed: new Date(), visitCount: { increment: 1 } },
    });

    res.redirect(link.originalUrl); // Ensure "originalUrl" matches your schema field
  }
);

// Register the redirect route with asyncHandler
app.get("/:short_url", redirectLink); // Example: /abc123 => redirects to original URL

// Register API routes
app.use("/api", route); // Endpoint for creating short links

// Connect to the database and start the server
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
