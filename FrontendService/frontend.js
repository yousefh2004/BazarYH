const express = require("express");

const app = express();

app.get("/search/:topic", (req, res) => {
  const topic = req.params.topic;

  res.json({
    msg: "search route is working",
    topic: topic
  });
});

app.get("/info/:id", (req, res) => {
  const id = req.params.id;

  res.json({
    msg: "info route is working",
    id: id
  });
});

app.post("/purchase/:id", (req, res) => {
  const id = req.params.id;

  res.json({
    msg: "purchase route is working",
    id: id
  });
});

app.listen(5000, () => {
  console.log("Frontend service running on port 5000");
});