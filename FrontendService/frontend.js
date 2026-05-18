const express = require("express");
const axios = require("axios");

const app = express();

// Backend service URLs Docker (Load Balancer)
const {
  getCatalogServer,
  getOrderServer
} = require("./loadBalancer");

// simple in-memory cache
const cache = new Map();


// Search requests to the catalog service
app.get("/search/:topic", async (req, res) => {
  const topic = req.params.topic;
  try {

    const catalogURL = getCatalogServer();

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

    // CACHE CHECK
    if (cache.has(id)) {
      console.log("CACHE HIT");
      return res.json(cache.get(id));
    }

    console.log("CACHE MISS");

    const catalogURL = getCatalogServer();

    const response = await axios.get(`${catalogURL}/info/${id}`);

    cache.set(id, response.data);

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

    const orderURL = getOrderServer();

    const response = await axios.post(`${orderURL}/purchase/${id}`);

    // invalidate cache after purchase 
    if (cache.has(id)) {
      cache.delete(id);
      console.log("CACHE INVALIDATED:", id);
    }

    res.json(response.data);

  } catch (err) {
    if (err.response) {
      return res.status(err.response.status).json(err.response.data);
    }
    res.status(500).json({ msg: "order service error" });
  }
});


// manual invalidate endpoint
app.delete("/invalidate/:id", (req, res) => {
  const id = req.params.id;

  if (cache.has(id)) {
    cache.delete(id);
    console.log("CACHE INVALIDATED:", id);
  }

  res.json({ status: "invalidated" });
});


app.listen(5000, () => {
  console.log("Frontend service running on port 5000");
});