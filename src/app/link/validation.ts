import z from "zod";

const LINK_VALIDATION = z.object({
  originalUrl: z.string().url(),
  verificationSteps: z.object({}).passthrough(),
});

export default LINK_VALIDATION;
