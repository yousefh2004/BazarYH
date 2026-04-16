const express = require("express");
const axios = require("axios");

const app = express();

const catalogURL = "http://localhost:5001";

app.get("/search/:topic", async (req, res) => {
  const topic = req.params.topic;
  try {
    const response = await axios.get(`${catalogURL}/search/${topic}`);
    res.json(response.data);
  } catch (err) {
      if (err.response) {
      return res.status(err.response.status).json(err.response.data);
    }
    res.status(500).json({ msg: "catalog service error" });
  }

});

app.get("/info/:id", async (req, res) => {
  const id = req.params.id;
  try {
    const response = await axios.get(`${catalogURL}/info/${id}`);
    res.json(response.data);
  } catch (err) {
    if (err.response) {
      return res.status(err.response.status).json(err.response.data);
    }
    res.status(500).json({ msg: "catalog service error" });
  }
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