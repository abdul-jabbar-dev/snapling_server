
import express from "express";
import LINK_ROUTE from "../app/link/route";

const route = express.Router();

route.use("/link", LINK_ROUTE);

export default route;
