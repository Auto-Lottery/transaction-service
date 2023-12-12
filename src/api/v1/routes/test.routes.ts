import express from "express";
const testRoutes = express.Router();

testRoutes.get("/", (req, res) => {
  res.send({
    data: "test"
  });
});

export default testRoutes;
