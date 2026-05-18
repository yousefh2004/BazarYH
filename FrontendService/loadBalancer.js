const catalogServers = [
    "http://localhost:5001",
    "http://localhost:5002"
];

const orderServers = [
    "http://localhost:5003",
    "http://localhost:5004"
];

let catalogIndex = 0;
let orderIndex = 0;

function getCatalogServer() {

    const server = catalogServers[catalogIndex];

    catalogIndex =
        (catalogIndex + 1) % catalogServers.length;

    return server;
}

function getOrderServer() {

    const server = orderServers[orderIndex];

    orderIndex =
        (orderIndex + 1) % orderServers.length;

    return server;
}

module.exports = {
    getCatalogServer,
    getOrderServer
};