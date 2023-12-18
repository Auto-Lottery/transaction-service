import express from "express";
const V1Routes = express.Router();

V1Routes.get("/", (req, res) => {
  res.send({
    data: "v1"
  });
});

export default V1Routes;
