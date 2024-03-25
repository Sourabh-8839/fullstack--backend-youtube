import dotenv from "dotenv";

import connectDB from "./Db/database.js";

import { App } from "./App.js";

dotenv.config({ path: "./.env" });

const portNumber = process.env.PORT || 8000;

connectDB()
  .then((res) => {
    App.on((err) => {
      console.log(`ERROR RUNNING ON SERVER : ${err}`);
    });
    App.listen(portNumber, () => {
      console.log(`  Server is running at port ${portNumber}`);
    });
  })
  .catch((err) => {
    console.log(`MongoDb Connection Error !! : ${err.message}`);
  });
