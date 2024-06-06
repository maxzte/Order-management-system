import { basicUrlForStatic, ORDER_ROUTE } from "../../../utils/const.js";
import { getToken } from "../../reg.js";


const main = document.querySelector('.main_container');
let dropdownMenu = document.querySelectorAll('.dropdown-menu');
let chosedMenu = {};
let chosedDish = {};
let orderRows;
const validStatuses = ['Обробка замовлення', 'Замовлення виконується', 'Замовлення виконане', 'Оплачено'];

const token = getToken();

export async function order() {
    try {
        let orderRowsArr = [];
        const orderData = await fetchOrderData();
        console.log(orderData);
        main.innerHTML = '';
        orderRows = ''
        orderData.rows.forEach(element => {
            const createdAt = new Date(element.createdAt);
            const formattedCreatedAt = `${createdAt.getDate()}.${createdAt.getMonth() + 1}.${createdAt.getFullYear()} 
            ${createdAt.getHours()}:${createdAt.getMinutes()}`;

            const order = {
                id: element.id,
                user: element.user,
                userId: element.user.id,
                orderAmount: element.orderAmount,
                status: element.status,
                createdAt: formattedCreatedAt
            };

            // orderRowsArr.push(order);

            orderRows += `
            <tr class="table_row" data-bs-toggle="modal" data-bs-target="#detailInfoModal">
                <td class="column">${element.id}</td>
                <td class="column">${element.user.name}</td>
                <td class="column">${element.user.id}</td>
                <td class="column">${element.orderAmount}</td>
                <td class="column">${element.status}</td>
                <td class="column">${formattedCreatedAt}</td>
                <td class="column">
                    <button class="delete" data-id="${element.id}">Del</button>
                </td>
            </tr>
        `;
        });

        const categoryHTML = `
        <div class="create_container">
            <div class="input-form">
                <h1 class="create">Find orders by userId</h1>
                <div class="dropdown_container">
                    <label for="name_input" class="name_text">ID</label>
                    <input type="text" class="name_input">
                    <div class="dropdown">
                        <button class="btn btn-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                        Sort by status
                        </button>
                        <ul class="dropdown-menu" aria-labelledby="dropdownMenuButton">
                            <li><a id="all_orders" class="dropdown-item sort-option" href="#">Всі замовлення</a></li>
                            <li><a class="dropdown-item sort-option" href="#" data-sort="Обробка замовлення">Обробка замовлення</a></li>
                            <li><a class="dropdown-item sort-option" href="#" data-sort="Замовлення виконується">Замовлення виконується</a></li>
                            <li><a class="dropdown-item sort-option" href="#" data-sort="Замовлення виконане">Замовлення виконане</a></li>
                            <li><a class="dropdown-item sort-option" href="#" data-sort="Оплачено">Оплачено</a></li>
                        </ul>
                    </div>
                    <div>
                        <b>Chosed status:</b>
                        <b class="choosedMenu"></b>
                    </div>
                </div>
                <div class="buttons">
                    <button type="button" id="submit_btn">Submit</button>
                </div>
            </div>
        </div>
        <div class="container-table">
            <div class="wrap-table">
                <div class="table">
                    <table>
                        <thead>
                            <tr class="table-head">
                                <th class="column">ID</th>
                                <th class="column">User</th>
                                <th class="column">UserId</th>
                                <th class="column">Total price</th>
                                <th class="column">Status</th>
                                <th class="column">Created at</th>
                                <th class="column">Actions</th>
                            </tr>
                        </thead>
                        <tbody class="dishTable_body">
                            ${orderRows}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
        <div class="modal fade edit-modal" tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h1 class="modal-title fs-5" id="exampleModalLabel">Edit category</h1>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <form id="uploadForm">
                            <div class="mb-3">
                                <label for="menu_name" class="col-form-label">Status:</label>
                                <div class="dropdown">
                                    <button class="btn btn-secondary dropdown-toggle" type="button" id="dropdownMenuButton" data-bs-toggle="dropdown" aria-expanded="false">
                                    Sort by status
                                    </button>
                                    <ul class="dropdown-menu" aria-labelledby="dropdownMenuButton">
                                        <li><a class="dropdown-item sort-option" href="#" data-sort="Обробка замовлення">Обробка замовлення</a></li>
                                        <li><a class="dropdown-item sort-option" href="#" data-sort="Замовлення виконується">Замовлення виконується</a></li>
                                        <li><a class="dropdown-item sort-option" href="#" data-sort="Замовлення виконане">Замовлення виконане</a></li>
                                        <li><a class="dropdown-item sort-option" href="#" data-sort="Оплачено">Оплачено</a></li>
                                    </ul>
                                </div>
                                <input type="text" class="form-control" id="menu_name">
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                        <button type="button" class="btn btn-primary" id="applyButton">Apply</button>
                    </div>
                </div>
            </div>
        </div>
        <div class="modal fade edit_order" id="edit_order" tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h1 class="modal-title fs-5" id="exampleModalLabel">Edit category</h1>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                        <div class="modal-body">
                            <form id="uploadForm">
                                <div class="mb-3">
                                    <label for="dish_name" class="col-form-label">Dish:</label>
                                    <div class="dropdown">
                                        <button class="btn btn-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                                        Choose dish
                                        </button>
                                        <ul class="dropdown-menu dish"></ul>
                                    </div>
                                    <input type="text" class="form-control" id="dish_name">
                                </div>
                                <div class="mb-3">
                                    <label for="dish_quantity" class="col-form-label">Quantity:</label>
                                    <input type="text" class="form-control" id="dish_quantity">
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                            <button type="button" class="btn btn-primary" id="applyEditButton">Apply</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="modal fade" id="detailInfoModal" tabindex="-1" aria-labelledby="detailInfoModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-xl">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="detailInfoModalLabel">Order Details</h5>
                        <button id="close_order-info_modal-header" type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <div class="mb-3">
                            <label for="user-info-list" class="col-form-label">User info list:</label>
                            <span class="user-info-list"></span>
                        </div>
                        <div class="mb-3">
                            <label for="order-info-list" class="col-form-label">Order info list:</label>
                            <span class="order-info-list"></span>
                        </div>
                        <div class="mb-3">
                            <label for="order_items-list" class="col-form-label">Order items list:</label>
                            <ul class="order_items-list"></ul>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button id="close_order-info_modal-footer" type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                    </div>
                </div>
            </div>
        </div>
        `
        main.innerHTML += categoryHTML;
        setupSortDropdown(orderData);
        // dropdownHandler();
        editDropdownHandler();
        submitBtnHandler();
        deleteOrderHandler();
        clickOnUserOrderHandler();
        closeModalInfoHandler();
    } catch (e) {
        console.error('Error retrieving information for category: ', e.message);
    }
}

function dropdownHandler() {
    document.querySelectorAll('.dropdown-item').forEach(e => {
        e.addEventListener('click', async (event) => {
            event.preventDefault();
            chosedMenu.name = e.textContent;
            chosedMenu.id = e.dataset.id;
            document.querySelector('.choosedMenu').textContent = chosedMenu.name;
            document.getElementById('menu_name').value = chosedMenu.name;
            // console.log(chosedMenu);
        })
    })
}

function editDropdownHandler() {
    document.querySelectorAll('.dropdown-item-dish').forEach(e => {
        e.addEventListener('click', async (event) => {
            event.preventDefault();
            chosedDish.name = e.value;
            chosedDish.id = e.dataset.id;
            document.getElementById('dish_name').value = chosedDish.name;
            document.getElementById('dish_quantity').value = chosedDish.id;
            // console.log(e);
        })
    })
}

function setupSortDropdown(orderData) {
    document.querySelectorAll('.sort-option').forEach(option => {
        option.addEventListener('click', async (e) => {
            e.preventDefault();
            const sortStatus = e.target.getAttribute('data-sort');
            if (e.target.textContent == document.getElementById('all_orders').textContent) {
                // orderRowsArr = [];
                // await order();
            }
            else {
                sortOrdersByStatus(sortStatus, orderData);
            }
        });
    });
}

function sortOrdersByStatus(status, orderData) {
    console.log('data')
    console.log(orderData)
    const sortedRows = orderData.rows.filter(i => i.status === status);
    console.log('sortedros')
    console.log(sortedRows)
    updateOrderTable(sortedRows);
}

function submitBtnHandler() {
    document.getElementById('submit_btn').addEventListener('click', async (e) => {
        e.preventDefault();
        const userId = document.querySelector('.name_input')
        if (userId.value.trim() === '') {
            // orderRowsArr = [];
            await order();
        }
        else await findUserById();
    });
}

function deleteOrderHandler() {
    let orderIdForDel = document.querySelectorAll('.delete');
    orderIdForDel.forEach(el => {
        el.addEventListener('click', async (e) => {
            e.preventDefault()
            const orderId = el.getAttribute('data-id');
            await fetchDeleteOrder(orderId);
            // orderRowsArr = [];
            // await order();
        })
    })
}

function editOrderHandler(orderData) {
    let orderIdForUpd = document.querySelectorAll('.update');
    orderIdForUpd.forEach(el => {
        el.addEventListener('click', async (e) => {
            e.preventDefault();
            const orderId = el.getAttribute('data-id');
            // console.log('orderDATA')
            // console.log(orderData)
            let orderElement
            if (orderData.rows) orderElement = orderData.rows//.find(item => item.id == orderId)
            else if (!orderData.rows) orderElement// = Object.values(orderData).find(item => item.id == orderId);
            const detailOrder = await fetchDetailOrderInfo(orderId);
            //const res = detailOrder.order_items.find(item => item.id == orderId)
            // console.log('res: ', res);
            console.log('Dishes: ', detailOrder);
            await getDishes(detailOrder);
            if (orderElement) {
                await addEventListenersForUpdate(detailOrder.userId, detailOrder);
            }
        });
    });
}

async function addEventListenersForUpdate(userId, orderElement) {
    const selectedDish = document.querySelector('.dropdown-menu.dish .selected');
    if (selectedDish) {
        const dishName = selectedDish.getAttribute('data-dish-name');
        document.querySelector('#dish_name').value = dishName;
        // document.querySelector('#dish_quantity').value = orderElement.amount;
    }
    document.getElementById('applyEditButton').onclick = async (a) => {
        a.preventDefault();
        const res = await fetchUpdOrder(userId);
        // console.log(res)
    };
}

async function addEventListenersForUpdStatus() {
    let orderIdForUpd = document.querySelectorAll('.upd_status');
    orderIdForUpd.forEach(el => {
        el.addEventListener('click', async (e) => {
            e.preventDefault();
            const orderId = el.getAttribute('data-id');
            document.getElementById('applyButton').onclick = async (a) => {
                a.preventDefault();
                const res = await fetchUpdOrderStatus(orderId);
                // if (res) {
                //     const modal = document.querySelector('.edit-modal');
                //     const bsModal = bootstrap.Modal.getInstance(modal);
                //     bsModal.hide();
                //     orderRowsArr = [];
                //     await order();
                // }
            };
        });
    });
}

async function clickOnUserOrderHandler() {
    const tableRows = document.querySelectorAll('.table_row');
    tableRows.forEach(e => {
        e.addEventListener('click', async (event) => {
            const orderId = e.querySelector('.column').textContent;
            const res = await fetchDetailOrderInfo(orderId);
            showDetailInfoModalWindow(res)
        });
    })
}

function closeModalInfoHandler() {
    const userInfoList = document.querySelector('.user-info-list');
    const orderInfoList = document.querySelector('.order-info-list');
    const orderItemsList = document.querySelector('.order_items-list');
    const modal = document.getElementById('detailInfoModal');

    modal.addEventListener('hidden.bs.modal', function (e) {
        userInfoList.innerHTML = '';
        orderInfoList.innerHTML = '';
        orderItemsList.innerHTML = '';
    })
}

export async function fetchOrderData() {
    const response = await fetch(ORDER_ROUTE, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
    });

    return response.json();
}

async function findUserById() {
    const userId = document.querySelector('.name_input').value;
    const response = await fetch(ORDER_ROUTE + `/all/${userId}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
    });
    // console.log('by uID')
    console.log(await response.json())
    // updateOrderTable(await response.json());
}

async function fetchDeleteOrder(orderId) {
    const response = await fetch(ORDER_ROUTE + `/${orderId}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
    });

    await order();
    // return response.json();
}

async function fetchUpdOrder(userId) {
    const selectedDish = document.querySelector('.dropdown-menu.dish .selected');
    if (!selectedDish) {
        console.error('No dish selected');
        return;
    }
    const dishId = selectedDish.dataset.id;
    console.log(dishId)
    const quantity = document.getElementById('dish_quantity').value;
    console.log(quantity)
    const formData = new FormData();
    formData.append('dishId', dishId);
    formData.append('quantity', quantity);

    const response = await fetch(ORDER_ROUTE + `/${userId}`, {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${token}`
        },
        body: formData,
    });

    const result = await response.json();
    const modal = document.getElementById('edit_order');
    const bsModal = bootstrap.Modal.getInstance(modal);
    bsModal.hide();
    // orderRowsArr = [];
    // await order();

    return result;
}

async function fetchUpdOrderStatus(orderId) {
    const status = document.querySelector('#menu_name').value;
    console.log(status)
    const formData = new FormData();
    formData.append('status', status);
    console.log(ORDER_ROUTE + `/updStatus/${orderId}`)
    const response = await fetch(ORDER_ROUTE + `/updStatus/${orderId}`, {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${token}`
        },
        body: formData,
    });

    await order();
    // return response.json();
}

async function fetchDetailOrderInfo(orderId) {
    const response = await fetch(ORDER_ROUTE + `/${orderId}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
    });
    return response.json();
}

async function updateOrderTable(sortedRows) {
    const orderTableBody = document.querySelector('.dishTable_body');
    orderTableBody.innerHTML = '';
    let data
    if (sortedRows.rows) data = sortedRows.rows
    else if (!sortedRows.rows) data = sortedRows
    data.forEach(async element => {
        const createdAt = new Date(element.createdAt);
        const formattedCreatedAt = `${createdAt.getDate()}.${createdAt.getMonth() + 1}.${createdAt.getFullYear()} 
        ${createdAt.getHours()}:${createdAt.getMinutes()}`;

        const rowHTML = `
        <tr class="table_row" data-bs-toggle="modal" data-bs-target="#detailInfoModal">
                <td class="column">${element.id}</td>
                <td class="column">${element.user.name}</td>
                <td class="column">${element.userId}</td>
                <td class="column">${element.orderAmount}</td>
                <td class="column">${element.status}</td>
                <td class="column">${formattedCreatedAt}</td>
                <td class="column">
                    <button class="delete" data-id="${element.id}">Del</button>
                    <button class="update" data-id="${element.id}" data-bs-toggle="modal" data-bs-target=".edit_order">Edit</button>
                    <button class="upd_status" data-id="${element.id}" data-bs-toggle="modal" data-bs-target=".edit-modal">Upd status</button>
                </td>
        </tr>`;
        orderTableBody.innerHTML += rowHTML;
        const updateStatusBtn = document.querySelector('.upd_status');
        const updateOrderBtn = document.querySelector('.update');
        if (element.status === validStatuses[3] || element.status === validStatuses[2]) {
            updateStatusBtn.classList.add('hidden');
            updateOrderBtn.classList.add('hidden');
        } else {
            updateStatusBtn.classList.remove('hidden');
            updateOrderBtn.classList.remove('hidden');
        }
    });
    // orderRowsArr = [];
    setupSortDropdown();
    deleteOrderHandler();
    await addEventListenersForUpdStatus();
    clickOnUserOrderHandler();
    editOrderHandler(sortedRows);
    dropdownHandler();
    editDropdownHandler();
    closeModalInfoHandler();
    // console.log('sortedRows:')
    // console.log(sortedRows)
}

function showDetailInfoModalWindow(data) {
    // console.log(data);
    const createdAt = new Date(data.createdAt);
    const formattedCreatedAt = `${createdAt.getDate()}.${createdAt.getMonth() + 1}.${createdAt.getFullYear()} 
    ${createdAt.getHours()}:${createdAt.getMinutes()}`;

    const userInfo = document.querySelector('.user-info-list');
    userInfo.innerHTML = `ID: ${data.userId}, name: ${data.user.name}, email: ${data.user.email}`

    const orderInfo = document.querySelector('.order-info-list');
    orderInfo.innerHTML = `<b>Total price: ${data.orderAmount}, status: ${data.status}</b>,<br>
    ID: ${data.id}, created: ${formattedCreatedAt}`

    const ul = document.querySelector('.order_items-list');
    const dishIds = new Set();

    data.order_items.forEach(i => {
        if (!dishIds.has(i.dishId)) {
            dishIds.add(i.dishId);

            const imageUrl = `${basicUrlForStatic}/static/${i.dish.img}`;
            const li = document.createElement('li');
            li.innerHTML = `ID: ${i.id},<br>
            Dishes:<br>
            ID: ${i.dishId}, name: ${i.dish.name}, price: ${i.dish.price} x ${i.amount}<br>`;
            const img = document.createElement('img');
            img.setAttribute('class', 'image_table');
            img.setAttribute('src', imageUrl);
            li.appendChild(img);
            ul.appendChild(li);
        }
    });
}

async function getDishes(detailOrder) {
    const dishMenu = document.querySelector('.dropdown-menu.dish');
    dishMenu.innerHTML = '';
    detailOrder.order_items.forEach(e => {
        const li = document.createElement('li');
        // const li = document.createElement('a');
        li.dataset.id = e.dishId;
        li.classList.add('dropdown-item-dish');
        li.textContent = e.dish.name;
        li.setAttribute('data-dish-name', e.dish.name);
        li.addEventListener('click', (event) => {
            event.preventDefault();
            document.querySelectorAll('.dropdown-menu.dish .dropdown-item-dish').forEach(item => item.classList.remove('selected'));
            li.classList.add('selected');

            chosedDish.name = li.getAttribute('data-dish-name');
            chosedDish.id = li.dataset.id;
            document.getElementById('dish_name').value = chosedDish.name;
            document.getElementById('dish_quantity').value = chosedDish.id;
        });
        // li.appendChild(link);
        dishMenu.appendChild(li);
    });
}