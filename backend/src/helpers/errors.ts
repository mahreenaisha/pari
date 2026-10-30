import type { ErrorRequestHandler, RequestHandler } from "express";
import multer from "multer";
import { ZodError } from "zod";
import type { Logger } from "./logger.js";

export class AppError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const notFound = (what: string) => new AppError(404, "NOT_FOUND", `${what} not found`);

export interface ErrorBody {
  error: { code: string; message: string; details?: unknown };
}

export const notFoundHandler: RequestHandler = (req, res) => {
  const body: ErrorBody = { error: { code: "ROUTE_NOT_FOUND", message: `No route for ${req.method} ${req.path}` } };
  res.status(404).json(body);
};

export function errorHandler(logger: Logger): ErrorRequestHandler {
  return (err, _req, res, _next) => {
    let status = 500;
    let body: ErrorBody = { error: { code: "INTERNAL", message: "Something went wrong" } };

    if (err instanceof AppError) {
      status = err.status;
      body = { error: { code: err.code, message: err.message, details: err.details } };
    } else if (err instanceof ZodError) {
      status = 400;
      body = {
        error: {
          code: "VALIDATION_ERROR",
          message: "Request validation failed",
          details: err.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
        },
      };
    } else if (err instanceof multer.MulterError) {
      status = 400;
      body = { error: { code: "UPLOAD_ERROR", message: err.message } };
    } else if (err?.type === "entity.parse.failed") {
      status = 400;
      body = { error: { code: "INVALID_JSON", message: "Request body is not valid JSON" } };
    }

    if (status >= 500) logger.error({ err }, "request failed");
    res.status(status).json(body);
  };
}
