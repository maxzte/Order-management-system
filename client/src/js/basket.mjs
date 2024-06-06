import { BASKET_ROUTE, ORDER_ROUTE } from "../utils/const.js"

const urlParams = new URLSearchParams(window.location.search);
const id = urlParams.get('id');

document.addEventListener("DOMContentLoaded", async function () {
    const res = await fetchAllBasketItems();
    createBasketTable(res);
    attachEventListeners();

    document.querySelector('.home-button').addEventListener('click', e => {
        e.preventDefault();
        window.location.href = `index.html?id=${id}`
    })

    document.querySelector('.order-button').addEventListener('click', e => {
        e.preventDefault();
        window.location.href = `orders.html?id=${id}`
    })
});

async function fetchAllBasketItems() {
    const response = await fetch(BASKET_ROUTE + `/allItems/${id}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    });
    return await response.json();
}

async function fetchDeleteItemFromBasket(basketItemId) {
    const response = await fetch(BASKET_ROUTE + `/${basketItemId}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
        },
    })
    if (response.ok) {
        const res = await fetchAllBasketItems();
        createBasketTable(res);
        attachEventListeners();
    } else return await response.json();
}

async function fetchDeleteAllFromBasket() {
    const response = await fetch(BASKET_ROUTE, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
        },
    })
    if (response.ok) {
        const res = await fetchAllBasketItems();
        createBasketTable(res);
        attachEventListeners();
    } else return await response.json();
}

async function fetchUpdBasketItems(basketItemsArr) {
    const response = await fetch(BASKET_ROUTE + `/${id}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(basketItemsArr)
    })
    if (response.ok) {
        const res = await fetchAllBasketItems();
        createBasketTable(res);
        attachEventListeners();
    } else return await response.json();
}

async function fetchCreateOrder() {
    const response = await fetch(ORDER_ROUTE + `/${id}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
    })
    if (response.ok) {
        const res = await fetchAllBasketItems();
        createBasketTable(res);
        attachEventListeners();
    } else return await response.json();
}

function createBasketTable(basketItems) {
    console.log(basketItems)
    const tBody = document.querySelector('.tBody');
    tBody.innerHTML = ''
    basketItems.rows.forEach(i => {
        const row = document.createElement('tr');
        row.setAttribute('class', 'row');

        

        const dishName = document.createElement('td');
        dishName.setAttribute('class', 'dishName');
        dishName.setAttribute('data-dish-id', i.dishId);
        dishName.textContent = i.dish.name;

        const dishPrice = document.createElement('td');
        dishPrice.setAttribute('class', 'dishPrice');
        dishPrice.setAttribute('data-price', i.dish.price);
        dishPrice.textContent = i.dish.price;

        const dishQuantity = document.createElement('td');
        dishQuantity.setAttribute('data-quantity', i.quantity);
        dishQuantity.setAttribute('class', 'dishQuantity');

        const btnDecrease = document.createElement('button');
        btnDecrease.setAttribute('class', 'quantity-btn decrease-quantity');
        btnDecrease.textContent = '-';

        const btnIncrease = document.createElement('button');
        btnIncrease.setAttribute('class', 'quantity-btn increase-quantity');
        btnIncrease.textContent = '+';

        const quantity = document.createElement('span');
        quantity.setAttribute('class', 'quantity');
        quantity.textContent = i.quantity;

        const totalAmount = document.createElement('td');
        const total = document.createElement('span');
        total.setAttribute('class', 'total');
        total.textContent = (i.dish.price * i.quantity).toFixed(2);

        const action = document.createElement('td')
        action.setAttribute('class', 'del')
        const delBtn = document.createElement('button')
        delBtn.setAttribute('class', 'delBtn')
        delBtn.setAttribute('delete-data-id', i.id)
        delBtn.textContent = 'Delete'

        action.appendChild(delBtn);

        // dishName.appendChild(delBtn)

        dishQuantity.appendChild(btnDecrease);
        dishQuantity.appendChild(quantity);
        dishQuantity.appendChild(btnIncrease);

        totalAmount.appendChild(total);

        row.appendChild(dishName);
        row.appendChild(dishPrice);
        row.appendChild(dishQuantity);
        row.appendChild(totalAmount);
        row.appendChild(action);

        tBody.appendChild(row);

        delBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            await fetchDeleteItemFromBasket(i.id);
        });
    });
}

function attachEventListeners() {
    const cartTable = document.getElementById("cartTable");
    const cartTotal = document.getElementById("cartTotal");

    function updateCartTotal() {
        let total = 0;
        const totals = cartTable.querySelectorAll(".total");
        totals.forEach((totalElement) => {
            total += parseFloat(totalElement.textContent);
        });
        cartTotal.textContent = total.toFixed(2);
    }

    const increaseButtons = cartTable.querySelectorAll(".increase-quantity");
    const decreaseButtons = cartTable.querySelectorAll(".decrease-quantity");

    increaseButtons.forEach((button) => {
        button.addEventListener("click", () => {
            const quantityElement = button.parentElement.querySelector(".quantity");
            const totalElement = button.parentElement.parentElement.querySelector(".total");
            const price = parseFloat(button.parentElement.parentElement.querySelector('.dishPrice').textContent);

            if (quantityElement && totalElement) {
                let quantity = parseInt(quantityElement.textContent);
                quantity++;
                quantityElement.textContent = quantity;
                totalElement.textContent = (price * quantity).toFixed(2);
                updateCartTotal();
            } else {
                console.error("Elements not found:", { quantityElement, totalElement });
            }
        });
    });

    decreaseButtons.forEach((button) => {
        button.addEventListener("click", () => {
            const quantityElement = button.parentElement.querySelector(".quantity");
            const totalElement = button.parentElement.parentElement.querySelector(".total");
            const price = parseFloat(button.parentElement.parentElement.querySelector('.dishPrice').textContent);

            if (quantityElement && totalElement) {
                let quantity = parseInt(quantityElement.textContent);
                if (quantity > 0) {
                    quantity--;
                    quantityElement.textContent = quantity;
                    totalElement.textContent = (price * quantity).toFixed(2);
                    updateCartTotal();
                }
            } else {
                console.error("Elements not found:", { quantityElement, totalElement });
            }
        });
    });

    document.getElementById('clearButton').addEventListener('click', async e => {
        e.preventDefault()
        await fetchDeleteAllFromBasket();
    })

    document.getElementById('checkoutButton').addEventListener('click', async (e) => {
        const basketItemsArr = []
        document.querySelectorAll('.row').forEach(r => {
            const basketItemId = document.querySelector('.delBtn').getAttribute('delete-data-id')
            const dishId = document.querySelector('.dishName').getAttribute('data-dish-id')
            const dishQuantity = document.querySelector('.quantity').textContent
            const basketItem = { basketItemId, dishId, quantity: parseInt(dishQuantity) };

            basketItemsArr.push(basketItem);
        })
        console.log(basketItemsArr)
        const res = await fetchUpdBasketItems(basketItemsArr);
        console.log(res)
        const orderRes = await fetchCreateOrder();
        console.log(orderRes)
    })
}
