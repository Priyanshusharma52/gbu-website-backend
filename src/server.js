const app = require("./app");
const env = require("./config/env");
const { connectDb } = require("./config/db");
const { logInfo, logError } = require("./config/logger");
// // const bookingRoutes = require("./modules/booking");
// const bookingRoutes = require("./modules/booking");
// app.use("/api/bookings", bookingRoutes);

const startServer = async () => {
  try {
    await connectDb();

    app.listen(env.port, () => {
      logInfo(`GBU backend server running on http://localhost:${env.port}`, {
        env: env.nodeEnv,
        port: env.port,
      });
    });
  } catch (error) {
    logError("Failed to start server", {
      error: error.message,
      stack: error.stack,
    });
    process.exit(1);
  }
};

startServer();
