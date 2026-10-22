import type{ Request, Response, NextFunction } from "express";
import { redis } from "../config/redis.js";

const WINDOW_SECONDS = 60;
const MAX_REQUESTS = 5;

export async function rateLimiter(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const clientId = req.ip ?? "unknown"; //identify the client
        
        const currentWindow = Math.floor(Date.now() / 1000 / WINDOW_SECONDS); //gives 60sec window

        const key = `rate-limit:${clientId}:${currentWindow}`;  

        const count = await redis.incr(key);

        if(count === 1) {
            await redis.expire(key, WINDOW_SECONDS)
        }

        if(count > MAX_REQUESTS) {
            res.status(429).json({
                error: "Too many requests. Please try again later.",
            });
            return
        }
        next();

    } catch (error) {
        next(error);
    }
};