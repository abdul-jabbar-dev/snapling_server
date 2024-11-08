import PRISMA from "../../lib/pg";
import LINK_UTILS from "../../utils/linkGen";
import { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { stepsVerification } from "./stepsVarify";

// Define verificationSessions as an object
let verificationSessions: {
  [key: string]: { originalUrl: string; status: string };
} = {};

// Fetch all links
const Get_links = async () => {
  return await PRISMA.DB.link.findMany();
};

// Get a specific URL by its short URL
const Get_url = async (url: string) => {
  return await PRISMA.DB.link.findUnique({ where: { shortUrl: url } });
};

// Initiate a new verification session
const initiateVerification = async (req: Request, res: Response) => {
  const { originalUrl } = req.body;

  try {
    const verificationId = uuidv4();
    verificationSessions[verificationId] = { originalUrl, status: "initiated" };
    res.json({ verificationId });
  } catch (error) {
    console.error(
      "Error initiating verification: ------ line 31 s------",
      error
    );
    res.status(500).json({ error: "Internal server error" });
  }
};

// Verify the status of the verification session
const verifyStatus = (req: Request, res: Response) => {
  const verificationId = req.params.id as string;

  try {
    const session = verificationSessions[verificationId];

    if (!session) {
      console.error(
        "Invalid verification ID:------ line 44 s------",
        verificationId
      );
      return res.status(400).json({ error: "Invalid verification ID" });
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    let stepIndex = 0;
    const steps: Array<
      "Syntax Validation" | "DNS Lookup" | "HTTP Check" | "Spam Check"
    > = ["Syntax Validation", "DNS Lookup", "HTTP Check", "Spam Check"];

    const intervalId = setInterval(async () => {
      if (stepIndex < steps.length) {
        const step = steps[stepIndex];
        res.write(`data: ${JSON.stringify({ status: "process", step })}\n\n`);

        try {
          const status: "process" | "success" | { error?: string } =
            await stepsVerification(step, session.originalUrl);

          if (typeof status === "object") {
            res.write(
              `data: ${JSON.stringify({ error: status.error, step })}\n\n`
            );
            if (step === "Syntax Validation") {
              clearInterval(intervalId);
              session.status = "failed";
              res.write(`data: ${JSON.stringify({ status: "failed" })}\n\n`);
              res.end();
              return;
            }
          } else {
            res.write(`data: ${JSON.stringify({ status, step })}\n\n`);
          }
        } catch (error) {
          res.write(
            `data: ${JSON.stringify({
              error: (error as any).message,
              step,
            })}\n\n`
          );
        }

        stepIndex++;
      }else {
        try {
          // Generate a unique short URL
          let shortUrl = await LINK_UTILS.GenerateShortURL();
      
          // Save the new link entry in the database
          const result = await PRISMA.DB.link.create({
            data: { originalUrl: session.originalUrl, shortUrl },
          });
      
          if (!result.shortUrl) {
            throw new Error("Internal server error");
          }
      
          // Clear interval and mark session as completed
          clearInterval(intervalId);
          session.status = "completed";
      
          // Send the success response to the client
          res.write(
            `data: ${JSON.stringify({
              status: "completed",
              shortUrl: result.shortUrl,
            })}\n\n`
          );
        } catch (error) {
          // Send error message to client
          res.write(
            `data: ${JSON.stringify({
              status: "error",
              message:
                typeof error === "string"
                  ? error
                  : error instanceof Error
                  ? error.message
                  : "Internal server error",
            })}\n\n`
          );
        } finally {
          // End the response to ensure client-side knows the process is finished
          res.end();
        }
      }
      
    }, 1000);

    req.on("close", () => {
      clearInterval(intervalId);
      delete verificationSessions[verificationId];
      res.write(
        `data: ${JSON.stringify({
          status: "aborted",
          message: "Verification session closed",
        })}\n\n`
      );
      res.end();
    });
  } catch (error) {
    console.error("Error during verification:------ line 106 s------", error);
    res
      .status(500)
      .json({ error: "Internal server error during verification" });
  }
};

// Export the LINK_SERVICE module
const LINK_SERVICE = { Get_links, Get_url, initiateVerification, verifyStatus };
export default LINK_SERVICE;
