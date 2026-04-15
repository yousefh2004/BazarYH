const express = require("express");
const fs = require("fs");
const csv = require("csv-parser");
const path = require("path");

const app = express();


const catalogPath = path.join(__dirname, "data", "catalog.csv");

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
          price: parseInt(row.price),
        });
      })
      .on("end", () => resolve(books))
      .on("error", (err) => reject(err));
  });
}

function writeCatalog(books) {
  let content = "id,title,topic,quantity,price\n";
  for (let b of books) {
    content += `${b.id},"${b.title}","${b.topic}",${b.qty},${b.price}\n`;
  }
  fs.writeFileSync(catalogPath, content);
}

app.get("/search/:topic", async (req, res) => {
  const topic = req.params.topic;
  const books = await readCatalog();

  const result = [];
  for (let b of books) {
    if (b.topic.toLowerCase() == topic.toLowerCase()) {
      result.push({ id: b.id, title: b.title });
    }
  }

  if (result.length == 0) {
    return res.status(404).json({ msg: "no books found" });
  }

  res.json(result);
});

app.get("/info/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const books = await readCatalog();

  let book = null;
  for (let b of books) {
    if (b.id == id) {
      book = b;
      break;
    }
  }

  if (!book) {
    return res.status(404).json({ msg: "no book found" });
  }

  res.json({
    title: book.title,
    quantity: book.qty,
    price: book.price,
  });
});

app.post("/update/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const books = await readCatalog();

  let book = null;
  for (let b of books) {
    if (b.id == id) {
      book = b;
      break;
    }
  }

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
});
app.listen(5001, () => {
    console.log("Catalog service running on port 5001");
  });