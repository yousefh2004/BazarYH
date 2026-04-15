const express = require("express");
const axios = require("axios");
const fs = require("fs");

const app = express();

app.post("/purchase/:id", async (req, res) => {
  const id = req.params.id;

  const response = await axios.get(`http://localhost:5001/info/${id}`);
  const book = response.data;

  if (!book || book.qty <= 0) {
    return res.status(400).json({ msg: "out of stock" });
  }

  await axios.post(`http://localhost:5001/update/${id}`);

  fs.appendFileSync("orders.txt", `bought book ${book.title}\n`);

  res.json({ msg: "purchase successful" });
});

app.listen(5002);