const express = require("express");
const axios = require("axios");

const app = express();

// Backend service URLs Docker
const catalogURL = "http://catalog-service:5001";
const orderURL = "http://order-service:5002";

// Search requests to the catalog service
app.get("/search/:topic", async (req, res) => {
  const topic = req.params.topic;
  try {
    const response = await axios.get(`${catalogURL}/search/${encodeURIComponent(topic)}`);
    res.json(response.data);
  } catch (err) {
      if (err.response) {
      return res.status(err.response.status).json(err.response.data);
    }
    res.status(500).json({ msg: "catalog service error" });
  }

});

// Info requests to the catalog service
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

// Purchase requests to the order service
app.post("/purchase/:id", async (req, res) => {
  const id = req.params.id;
  try {
    const response = await axios.post(`${orderURL}/purchase/${id}`);
    res.json(response.data);
  } catch (err) {
    if (err.response) {
      return res.status(err.response.status).json(err.response.data);
    }
    res.status(500).json({ msg: "order service error" });
  }
});

app.listen(5000, () => {
  console.log("Frontend service running on port 5000");
});