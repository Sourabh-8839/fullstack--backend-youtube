import cookieParser from "cookie-parser";
import express from "express";
import cors from "cors";
const App = express();

App.use(
  cors({
    origin: process.env.CORS_ORIGIN,
  })
);
App.use(express.json({ limit: "16kb" }));

App.use(express.urlencoded({ extended: false, limit: "16kb" }));

// This is use for only file
App.use(express.static("public"));

App.use(cookieParser());

export { App };
