import dotenv from "dotenv";

import connectDB from "./Db/database.js";

dotenv.config({ path: "./.env" });

connectDB();
