import dotenv from "dotenv";
import app from "./app.js";

import connectDB from "./db/server.js";

dotenv.config({
  path: "./env",
});
connectDB()
  .then(() => {
    app.on("error", (error) => {
      console.log("ERROR", error);
      throw new error();
    });
    app.listen(process.env.PORT || 8000, () => {
      console.log(`server is running at port ${process.env.PORT}`);
    });
  })

  .catch((error) => {
    console.log(" mongodb connection faild", error);
  });

