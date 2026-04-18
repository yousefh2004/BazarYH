# BazarYH Microservices Book Store

BazarYH is a small online bookstore implemented using a multi-tier microservices architecture. The system allows users to search for books by topic, view book information, and purchase books.

## Services

- Frontend Service: receives client requests and forwards them to the correct backend service.
- Catalog Service: stores book information such as title, topic, quantity, and price.
- Order Service: handles purchase requests and records successful orders.

## Main APIs

Search books:

GET /search/:topic

Example:
http://localhost:5050/search/distributed%20systems

Get book information:

GET /info/:id

Example:
http://localhost:5050/info/1

Purchase book:

POST /purchase/:id

Example:
http://localhost:5050/purchase/1

## Run With Docker

From the project root directory, run:

docker compose up --build

To stop the services:

docker compose down

## Ports

When running with Docker, the frontend is exposed on:

http://localhost:5050

Internal service ports:

- Frontend Service: 5000
- Catalog Service: 5001
- Order Service: 5002

## Data Storage

- Catalog data is stored in CatalogService/data/catalog.csv
- Successful orders are stored in OrderService/orders.txt

## Example Test

Search for distributed systems books:

GET http://localhost:5050/search/distributed%20systems

Purchase a book:

POST http://localhost:5050/purchase/1

After a successful purchase, the book quantity decreases and the order is saved in orders.txt.
