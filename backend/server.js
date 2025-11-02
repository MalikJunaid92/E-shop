require("dotenv").config({
  path: "config/.env",
});
const app = require("./index");
const connectDatabase = require("./db/Database");

// Handling uncaught Exception
process.on("uncaughtException", (err) => {
  console.log(`Error: ${err.message}`);
  console.log(`shutting down the server for handling uncaught exception`);
  // Exit the process - this avoids leaving the old process listening on the port
  // which can cause EADDRINUSE when nodemon restarts the app.
  process.exit(1);
});

// config
if (process.env.NODE_ENV !== "PRODUCTION") {
  require("dotenv").config({
    path: "config/.env",
  });
}

// connect db
connectDatabase();

// create server
const server = app.listen(process.env.PORT, () => {
  console.log(`Server is running on http://localhost:${process.env.PORT}`);
});

// handle errors emitted by server (e.g. port already in use)
server.on("error", (err) => {
  if (err && err.code === "EADDRINUSE") {
    console.error(`Port ${process.env.PORT} is already in use.`);
    console.error("Shutting down due to EADDRINUSE.");
    process.exit(1);
  }
  // Re-throw other errors so the `uncaughtException` handler or Node can handle them
  throw err;
});

// unhandled promise rejection
process.on("unhandledRejection", (err) => {
  console.log(`Shutting down the server for ${err.message}`);
  console.log(`shutting down the server for unhandle promise rejection`);

  server.close(() => {
    process.exit(1);
  });
});
