const express = require("express");
const fs = require("fs");
const csv = require("csv-parser");
const path = require("path");

const app = express();
app.use(express.json());

// CSV file stores the catalog data
const catalogPath = path.join(__dirname, "data", "catalog.csv");

// Reads all books from catalog.csv a
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
          qty: parseInt(row.quantity),
          price: parseFloat(row.price),
        });
      })
      .on("end", () => resolve(books))
      .on("error", (err) => reject(err));
  });
}

// Writes the updated book back to catalog.csv
function writeCatalog(books) {
  let content = "id,title,topic,quantity,price\n";

  for (const b of books) {
    content += `${b.id},"${b.title}","${b.topic}",${b.qty},${b.price}\n`;
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
    console.error("[CATALOG] search error:", err.message);
    res.status(500).json({ msg: "catalog read error" });
  }
});

// Return information using id
app.get("/info/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ msg: "invalid book id" });
    }

    const books = await readCatalog();
    const book = books.find((b) => b.id === id);

    console.log(`[CATALOG] info(${id})`);

    if (!book) {
      return res.status(404).json({ msg: "no book found" });
    }

    res.json({
      title: book.title,
      quantity: book.qty,
      price: book.price,
    });
  } catch (err) {
    console.error("[CATALOG] info error:", err.message);
    res.status(500).json({ msg: "catalog read error" });
  }
});

// Update the quantity of a book
app.post("/update/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ msg: "invalid book id" });
    }

    const books = await readCatalog();
    const book = books.find((b) => b.id === id);

    console.log(`[CATALOG] update(${id})`);

    if (!book) {
      return res.status(404).json({ msg: "no book found" });
    }

    if (book.qty <= 0) {
      return res.status(400).json({ msg: "out of stock" });
    }

    book.qty -= 1;
    writeCatalog(books);

    res.json({
      msg: "updated",
      new_qty: book.qty,
    });
  } catch (err) {
    console.error("[CATALOG] update error:", err.message);
    res.status(500).json({ msg: "catalog update error" });
  }
});

app.listen(5001, () => {
  console.log("Catalog service running on port 5001");
});