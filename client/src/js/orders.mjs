import { ORDER_ROUTE } from "../utils/const.js";


const urlParams = new URLSearchParams(window.location.search);
const id = urlParams.get('id');

document.addEventListener("DOMContentLoaded", async () => {
    const res = await fetchAllOrderById(id)
    console.log(res)


    populateOrders(res);

    document.querySelector('.home-button').addEventListener('click', e => {
        e.preventDefault();
        window.location.href = `index.html?id=${id}`
    })

    document.querySelector('.basket-button').addEventListener('click', e => {
        e.preventDefault();
        window.location.href = `basket.html?id=${id}`
    })
});

async function fetchAllOrderById(userId) {
    const response = await fetch(ORDER_ROUTE + `/all/${userId}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    })

    return await response.json();
}

function populateOrders(orders) {
    const orderTable = document.getElementById("orderTable");
    const tbody = orderTable.querySelector("tBody");

    orders.rows.forEach((order, index) => {
        const createdAt = new Date(order.createdAt);
            const formattedCreatedAt = `${createdAt.getDate()}.${createdAt.getMonth() + 1}.${createdAt.getFullYear()} 
            ${createdAt.getHours()}:${createdAt.getMinutes()}`;
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

        const created = document.createElement('td')
        created.textContent = formattedCreatedAt

        
        itemsCell.appendChild(itemsList);
        orderRow.appendChild(itemsCell);
        orderRow.appendChild(created);

        const totalCostCell = document.createElement("td");
        totalCostCell.textContent = `$${order.orderAmount}`;
        orderRow.appendChild(totalCostCell);

        tbody.appendChild(orderRow);
    });
}