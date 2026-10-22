import "dotenv/config";
import { app } from "./app.js";
import { redis } from "./config/redis.js";

const PORT = Number(process.env.PORT) || 3000;

async function startServer() {
    await redis.ping()

    app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
});
};

startServer().catch(async(error) => {
    console.error("Failed to start Server", error)
    redis.disconnect();
    process.exitCode = 1;
    setTimeout(() => process.exit(1), 5000).unref();
});