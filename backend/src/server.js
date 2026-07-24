import app from "./app.js";
import { connectDatabase } from "./config/db.js";
import { env } from "./config/env.js";

const MAX_PORT_RETRIES = 10;

const listenWithRetry = (port, attempt = 0) => {
  const server = app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`Server is running on http://localhost:${port}`);
  });

  server.on("error", (error) => {
    if (error.code === "EADDRINUSE" && attempt < MAX_PORT_RETRIES) {
      const nextPort = port + 1;
      // eslint-disable-next-line no-console
      console.warn(`Port ${port} is in use. Retrying on port ${nextPort}...`);
      listenWithRetry(nextPort, attempt + 1);
      return;
    }

    // eslint-disable-next-line no-console
    console.error(`Failed to bind server on port ${port}:`, error.message);
    process.exit(1);
  });
};

const startServer = async () => {
  try {
    await connectDatabase();
    listenWithRetry(env.port);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();
