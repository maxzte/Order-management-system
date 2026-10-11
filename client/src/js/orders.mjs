import { ORDER_ROUTE } from "../utils/const.js";
import { formatDate, setupHeaderNavigation } from "../utils/helpers.js";
import { api } from "../utils/apiClient.js";

const urlParams = new URLSearchParams(window.location.search);
const id = urlParams.get('id');

document.addEventListener("DOMContentLoaded", async () => {
    const res = await fetchAllOrderById(id);
    populateOrders(res);
    setupHeaderNavigation(id);
});

async function fetchAllOrderById(userId) {
    return api.get(ORDER_ROUTE + `/all/${userId}`);
}

function populateOrders(orders) {
    const orderTable = document.getElementById("orderTable");
    const tbody = orderTable.querySelector("tBody");

    orders.rows.forEach((order, index) => {
        const formattedCreatedAt = formatDate(order.createdAt);
        const orderRow = document.createElement("tr");

        const orderNumberCell = document.createElement("td");
        orderNumberCell.textContent = order.id;
        orderRow.appendChild(orderNumberCell);

        const itemsCell = document.createElement("td");
        const itemsList = document.createElement("ul");
        order.order_items.forEach((item) => {
            const listItem = document.createElement("li");
            listItem.textContent = `${item.dish.name} x${item.amount} ($${item.price * item.amount
                })`;
            itemsList.appendChild(listItem);
        });

        const status = document.createElement('td')
        status.textContent = order.status

        const created = document.createElement('td')
        created.textContent = formattedCreatedAt

        
        itemsCell.appendChild(itemsList);
        orderRow.appendChild(itemsCell);
        orderRow.appendChild(created);
        orderRow.appendChild(status);

        const totalCostCell = document.createElement("td");
        totalCostCell.textContent = `$${order.orderAmount}`;
        orderRow.appendChild(totalCostCell);

        tbody.appendChild(orderRow);
    });
}