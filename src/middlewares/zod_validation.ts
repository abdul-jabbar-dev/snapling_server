import { Request, Response, NextFunction, RequestHandler } from "express";
import { ZodObject, ZodError, ZodRawShape } from "zod";

const ZOD_VALIDATION = (schema: ZodObject<ZodRawShape>): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate the request body against the schema
      schema.parse(req.body);
      next(); // Proceed if validation is successful
    } catch (error) {
      if (error instanceof ZodError) {
        // Send a 400 response with validation errors and return void
        res.status(400).json({
          message: "Validation failed",
          errors: error.errors,
        });
        return; // Explicitly return to satisfy RequestHandler's return type
      }
      next(error); // Forward other errors to error-handling middleware
    }
  };
};

export default ZOD_VALIDATION;
