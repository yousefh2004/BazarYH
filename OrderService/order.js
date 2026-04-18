const express = require("express");
const axios = require("axios");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(express.json());

const catalogURL = "http://catalog-service:5001";
const ordersPath = path.join(__dirname, "orders.txt");

app.post("/purchase/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ msg: "invalid book id" });
    }

    console.log(`[ORDER] purchase(${id})`);
    const response = await axios.get(`${catalogURL}/info/${id}`);
    const book = response.data;

    if (!book || book.quantity <= 0) {
      return res.status(400).json({ msg: "out of stock" });
    }
    
    await axios.post(`${catalogURL}/update/${id}`);
    fs.appendFileSync(ordersPath, `bought book ${book.title}\n`);
    console.log(`[ORDER] bought book ${book.title}`);
    res.json({
      msg: "purchase successful",
      title: book.title,
    });
  } catch (err) {
    if (err.response) {
      return res.status(err.response.status).json(err.response.data);
    }
    console.error("[ORDER] purchase error:", err.message);
    res.status(500).json({ msg: "order service error" });
  }
});

app.listen(5002, () => {
  console.log("Order service running on port 5002");
});