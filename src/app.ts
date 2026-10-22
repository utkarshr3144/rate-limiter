import express from "express";
import { rateLimiter } from "./middleware/rateLimiter.js";

export const app = express();

app.use(express.json());

app.get("/", (_req, res) => {
    res.json({
        message: "Rate Limiter API is running"
    })
});

app.get("/api/test", rateLimiter, (_req, res) => {
    res.json({message: "Request allowed"})
});