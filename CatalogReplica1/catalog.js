const express = require("express");
const fs = require("fs");
const csv = require("csv-parser");
const path = require("path");
const axios = require("axios");

const app = express();
app.use(express.json());

// CSV file stores the catalog data
const catalogPath = path.join(__dirname, "data", "catalog.csv");

// other replica (for replication)
const otherReplicaURL = "http://catalog-service-2:5002";

// Reads all books from catalog.csv
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
      .on("error", (err) => reject(err));
  });
}

// Writes the updated book back to catalog.csv
function writeCatalog(books) {
  let content = "id,title,topic,stock,price\n";

  for (const b of books) {
    content += `${b.id},"${b.title}","${b.topic}",${b.stock},${b.price}\n`;
  }

  fs.writeFileSync(catalogPath, content);
}

// Search books by topic
app.get("/search/:topic", async (req, res) => {
  try {
    const topic = req.params.topic.trim().toLowerCase();
    const books = await readCatalog();

    const result = books
      .filter((b) => b.topic.toLowerCase() === topic)
      .map((b) => ({
        id: b.id,
        title: b.title,
      }));

    console.log(`[CATALOG] search("${req.params.topic}")`);

    if (result.length === 0) {
      return res.status(404).json({ msg: "no books found" });
    }

    res.json(result);

  } catch (err) {
    res.status(500).json({ msg: "catalog read error" });
  }
});

// Return information using id
app.get("/info/:id", async (req, res) => {
  const id = parseInt(req.params.id);

  const books = await readCatalog();
  const book = books.find(b => b.id === id);

  if (!book) return res.status(404).json({ msg: "no book found" });

  res.json(book);
});

// Update the stock of a book (LOCAL + REPLICATION)
app.post("/update/:id", async (req, res) => {
  const id = parseInt(req.params.id);

  const books = await readCatalog();
  const book = books.find(b => b.id === id);

  if (!book) return res.status(404).json({ msg: "no book found" });

  if (book.stock <= 0) return res.status(400).json({ msg: "out of stock" });

  book.stock -= 1;
  writeCatalog(books);

  try {
    await axios.post(`${otherReplicaURL}/replicate_update`, {
      id: book.id,
      stock: book.stock
    });
  } catch (err) {
    console.error("replication error");
  }

  res.json({ msg: "updated", stock: book.stock });
});

// replication endpoint
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

app.listen(5001, () => {
  console.log("Catalog Replica 1 running on 5001");
});