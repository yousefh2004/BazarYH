const express = require("express");
const fs = require("fs");
const csv = require("csv-parser");
const path = require("path");
const axios = require("axios");

const app = express();
app.use(express.json());

const catalogPath = path.join(__dirname, "data", "catalog.csv");


const otherReplicaURL = "http://catalog-service-1:5001";

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

function writeCatalog(books) {
  let content = "id,title,topic,stock,price\n";

  for (const b of books) {
    content += `${b.id},"${b.title}","${b.topic}",${b.stock},${b.price}\n`;
  }

  fs.writeFileSync(catalogPath, content);
}

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

    console.log(`[CATALOG 2] search("${req.params.topic}")`);

    if (result.length === 0) {
      return res.status(404).json({ msg: "no books found" });
    }

    res.json(result);
  } catch (err) {
    res.status(500).json({ msg: "catalog read error" });
  }
});

app.get("/info/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const books = await readCatalog();
    const book = books.find((b) => b.id === id);

    console.log(`[CATALOG 2] info(${id})`);

    if (!book) {
      return res.status(404).json({ msg: "no book found" });
    }

    res.json(book);
  } catch (err) {
    res.status(500).json({ msg: "catalog read error" });
  }
});

app.post("/update/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const books = await readCatalog();
    const book = books.find((b) => b.id === id);

    if (!book) {
      return res.status(404).json({ msg: "no book found" });
    }

    if (book.stock <= 0) {
      return res.status(400).json({ msg: "out of stock" });
    }

    book.stock -= 1;
    writeCatalog(books);

    console.log(`[CATALOG 2] update(${id}) new stock=${book.stock}`);

    try {
      await axios.post(`${otherReplicaURL}/replicate_update`, {
        id: book.id,
        stock: book.stock,
      });
    } catch (err) {
      console.error("[CATALOG 2] replication error:", err.message);
    }

    res.json({ msg: "updated", stock: book.stock });
  } catch (err) {
    res.status(500).json({ msg: "catalog update error" });
  }
});

app.post("/replicate_update", async (req, res) => {
  try {
    const { id, stock } = req.body;

    const books = await readCatalog();
    const book = books.find((b) => b.id === id);

    if (book) {
      book.stock = stock;
      writeCatalog(books);
      console.log(`[CATALOG 2] replicated update(${id}) stock=${stock}`);
    }

    res.json({ msg: "replicated" });
  } catch (err) {
    res.status(500).json({ msg: "replication error" });
  }
});

app.listen(5001, () => {
  console.log("Catalog Replica 2 running on 5001");
});