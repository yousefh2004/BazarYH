const express = require("express");
const axios = require("axios");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(express.json());

const {
  getCatalogServer
} = require("../common/loadBalancer");

const frontendURL = "http://localhost:5000";

const ordersPath = path.join(__dirname, "orders.txt");

// Book purchase requests
app.post("/purchase/:id", async (req, res) => {
  const id = parseInt(req.params.id);

  try {
    await axios.delete(`${frontendURL}/invalidate/${id}`);

    const catalogServer = getCatalogServer();

    const response = await axios.get(`${catalogServer}/info/${id}`);
    const book = response.data;

    if (!book || book.stock <= 0) {
      return res.status(400).json({ msg: "out of stock" });
    }

    await axios.post(`${catalogServer}/update/${id}`);

    fs.appendFileSync(ordersPath, `bought book ${book.title}\n`);

    res.json({ msg: "purchase successful", title: book.title });

  } catch (err) {
    res.status(500).json({ msg: "order error" });
  }
});

app.listen(5004, () => {
  console.log("Order Replica 2 running on 5004");
});