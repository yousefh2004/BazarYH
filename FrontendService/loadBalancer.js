const catalogServers = [
    "http://catalog-service-1:5001",
    "http://catalog-service-2:5001"
];

const orderServers = [
    "http://order-service-1:5002",
    "http://order-service-2:5002"
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