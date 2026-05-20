const express = require("express");
const fs = require("fs");
const csv = require("csv-parser");
const path = require("path");
const axios = require("axios");

const app = express();
app.use(express.json());

const catalogPath = path.join(__dirname, "data", "catalog.csv");

// other replica
const otherReplicaURL = "http://catalog-service-1:5001";

// same functions (unchanged)
function readCatalog() {
  return new Promise((resolve, reject) => {
    const books = [];

    fs.createReadStream(catalogPath)
      .pipe(csv())
      .on("data", (row) => {
        books.push({
          id: parseInt(row.id),
          title: row.title,
          topic: row.topic,
          stock: parseInt(row.stock),
          price: parseFloat(row.price),
        });
      })
      .on("end", () => resolve(books))
      .on("error", reject);
  });
}

function writeCatalog(books) {
  let content = "id,title,topic,stock,price\n";

  for (const b of books) {
    content += `${b.id},"${b.title}","${b.topic}",${b.stock},${b.price}\n`;
  }

  fs.writeFileSync(catalogPath, content);
}

app.get("/search/:topic", async (req, res) => {
  const topic = req.params.topic.trim().toLowerCase();
  const books = await readCatalog();

  const result = books
    .filter(b => b.topic.toLowerCase() === topic)
    .map(b => ({ id: b.id, title: b.title }));

  res.json(result);
});

app.get("/info/:id", async (req, res) => {
  const id = parseInt(req.params.id);

  const books = await readCatalog();
  const book = books.find(b => b.id === id);

  if (!book) return res.status(404).json({ msg: "no book found" });

  res.json(book);
});

app.post("/update/:id", async (req, res) => {
  const id = parseInt(req.params.id);

  const books = await readCatalog();
  const book = books.find(b => b.id === id);

  book.stock -= 1;
  writeCatalog(books);

  try {
    await axios.post(`${otherReplicaURL}/replicate_update`, {
      id: book.id,
      stock: book.stock
    });
  } catch (err) {}

  res.json({ msg: "updated", stock: book.stock });
});

app.post("/replicate_update", async (req, res) => {
  const { id, stock } = req.body;

  const books = await readCatalog();
  const book = books.find(b => b.id === id);

  if (book) {
    book.stock = stock;
    writeCatalog(books);
  }

  res.json({ msg: "replicated" });
});

app.listen(5002, () => {
  console.log("Catalog Replica 2 running on 5002");
});