 
import LINK_VALIDATION from "./validation";
import ZOD_VALIDATION from "../../middlewares/zod_validation";
import { Router } from "express";

import {
  GetLinksController,
  GetUrlController,
  InitiateVerificationController,
  VerifyStatusController,
} from "./controller";

const LINK_ROUTE = Router();

LINK_ROUTE.get("/", GetLinksController);
LINK_ROUTE.get("/:short_link", GetUrlController);
LINK_ROUTE.post(
  "/new-gen",
  //  ZOD_VALIDATION(LINK_VALIDATION),
  InitiateVerificationController
);
LINK_ROUTE.get("/verify-status/:id", VerifyStatusController);

export default LINK_ROUTE;
