const express = require("express");
const axios = require("axios");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(express.json());

const catalogURL = "http://catalog-service-2:5001";
const frontendURL = "http://frontend-service:5000";

const ordersPath = path.join(__dirname, "orders.txt");


app.post("/purchase/:id", async (req, res) => {
  const id = parseInt(req.params.id);

  try {
    await axios.delete(`${frontendURL}/invalidate/${id}`);

    const response = await axios.get(`${catalogURL}/info/${id}`);
    const book = response.data;

    if (!book || book.stock <= 0) {
      return res.status(400).json({ msg: "out of stock" });
    }

    await axios.post(`${catalogURL}/update/${id}`);

    fs.appendFileSync(ordersPath, `bought book ${book.title}\n`);

    res.json({ msg: "purchase successful", title: book.title });

  } catch (err) {
    console.error("[ORDER REPLICA 2] error:", err.message);
    if (err.response) {
      return res.status(err.response.status).json(err.response.data);
    }
    res.status(500).json({ msg: "order error" });
  }
});

app.listen(5002, () => {
  console.log("Order Replica 2 running on 5002");
});