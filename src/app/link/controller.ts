import { Request, Response } from "express";
import LINK_SERVICE from "./service";

export const GetLinksController = async (req: Request, res: Response) => {
  try {
    const result = await LINK_SERVICE.Get_links();
    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching links:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const GetUrlController = async (req: Request, res: Response) => {
  const { short_link } = req.params;
  try {
    const result = await LINK_SERVICE.Get_url(short_link);
    if (result) {
      res.status(200).json(result);
    } else {
      res.status(404).json({ error: "URL not found" });
    }
  } catch (error) {
    console.error("Error fetching URL:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const InitiateVerificationController = async (
  req: Request,
  res: Response
) => {
  try { 
    await LINK_SERVICE.initiateVerification(req, res);
  } catch (error) {
    console.error("Error initiating verification:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const VerifyStatusController = (req: Request, res: Response) => {
  try {
    LINK_SERVICE.verifyStatus(req, res);
  } catch (error) {
    console.error("Error verifying status:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
