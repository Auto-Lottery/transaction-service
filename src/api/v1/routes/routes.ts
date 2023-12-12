import express from "express";
import testRoutes from "./test.routes";
const V1Routes = express.Router();

V1Routes.get("/", (req, res) => {
  res.send({
    data: "v1"
  });
});

V1Routes.use("/test", testRoutes);

export default V1Routes;
