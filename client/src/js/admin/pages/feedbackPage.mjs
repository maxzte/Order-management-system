import { FEEDBACK_ROUTE } from "../../../utils/const.js";
import { getToken } from "../../reg.js";

const main = document.querySelector('.main_container');
const token = getToken();

export async function feedback() {
    try {
        const feedbackData = await fetchFeedbackData();
        console.log(feedbackData)
        let feedbackRows = ''
        main.innerHTML = '';
        feedbackData.rows.forEach(element => {
            const createdAt = new Date(element.createdAt);
            const updatedAt = new Date(element.updatedAt);
            const formattedCreatedAt = `${createdAt.getDate()}.${createdAt.getMonth() + 1}.${createdAt.getFullYear()} 
            ${createdAt.getHours()}:${createdAt.getMinutes()}`;
            const formattedUpdatedAt = `${updatedAt.getDate()}.${updatedAt.getMonth() + 1}.${updatedAt.getFullYear()} 
            ${updatedAt.getHours()}:${updatedAt.getMinutes()}`;

            feedbackRows += `
            <tr>
                <td class="column">${element.id}</td>
                <td class="column">${element.text}</td>
                <td class="column">${element.user.name}</td>
                <td class="column">${element.userId}</td>
                <td class="column">${element.user.email}</td>
                <td class="column">${element.dish.name}</td>
                <td class="column">${element.dishId}</td>
                <td class="column">${formattedCreatedAt}</td>
                <td class="column">
                    <button class="delete" data-id="${element.userId}" data-dish-id="${element.dishId}">Del</button>
                </td>
            </tr>
        `;
        });

        const feedbackHTML = `
            <div class="create_container">
                <div class="input-form">
                    <h1 class="create">Find feedbacks by dishId</h1>
                    <label for="name_input" class="name_text">DishId</label>
                    <input type="text" class="name_input">
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
                                    <th class="column">Text</th>
                                    <th class="column">Name</th>
                                    <th class="column">UserId</th>
                                    <th class="column">Email</th>
                                    <th class="column">Dish name</th>
                                    <th class="column">DishId</th>
                                    <th class="column">Created</th>
                                    <th class="column">Actions</th>
                                </tr>
                            </thead>
                            <tbody class="dishTable_body">
                            ${feedbackRows}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
    `
        main.innerHTML += feedbackHTML;
        submitBtnHandler();
        deleteBtnHandler();

    } catch (e) {
        console.error('Error retrieving information for feedback: ', e.message);
    }
}

function submitBtnHandler() {
    document.getElementById('submit_btn').addEventListener('click', async (e) => {
        e.preventDefault();
        const res = await fetchFeedbacksByDishId();
        // console.log(res);
        updateOrderTable(res);
        // await feedback();
    });
}

function deleteBtnHandler() {
    let feedbackIdForDel = document.querySelectorAll('.delete');
    feedbackIdForDel.forEach(el => {
        el.addEventListener('click', async (e) => {
            e.preventDefault()
            const userId = el.getAttribute('data-id');
            const dishId = el.getAttribute('data-dish-id');
            // console.log(dishId)
            const res = await fetchDeleteFeedback(userId, dishId);
            // console.log(res)
            await feedback();
        })
    })
}

export async function fetchFeedbackData() {
    const response = await fetch(FEEDBACK_ROUTE, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
    });

    return response.json();
}

async function fetchFeedbacksByDishId() {
    const dishId = document.querySelector('.name_input').value;
    const response = await fetch(FEEDBACK_ROUTE + `/${dishId}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
    });

    return response.json();
}

async function fetchDeleteFeedback(userId, dishId) {
    console.log(dishId)
    const response = await fetch(FEEDBACK_ROUTE + `/${userId}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        // body: { 'dishId': dishId },
        body: JSON.stringify({ dishId })
    });

    return response.json();
}

async function updateOrderTable(dishFeedbackData) {
    const orderTableBody = document.querySelector('.dishTable_body');
    orderTableBody.innerHTML = '';
    dishFeedbackData.rows.forEach(async element => {
        const createdAt = new Date(element.createdAt);
        const formattedCreatedAt = `${createdAt.getDate()}.${createdAt.getMonth() + 1}.${createdAt.getFullYear()} 
        ${createdAt.getHours()}:${createdAt.getMinutes()}`;

        const rowHTML = `
        <tr class="table_row" data-bs-toggle="modal" data-bs-target="#detailInfoModal">
            <td class="column">${element.id}</td>        
            <td class="column">${element.text}</td>    
            <td class="column">${element.user.name}</td>    
            <td class="column">${element.userId}</td>    
            <td class="column">${element.user.email}</td>    
            <td class="column">${element.dish.name}</td>    
            <td class="column">${element.dishId}</td>    
            <td class="column">${formattedCreatedAt}</td>    
            <td class="column">    
                <button class="delete" data-id="${element.userId}" data-dish-id="${element.dishId}">Del</button>
            </td>    
        </tr>`;
        orderTableBody.innerHTML += rowHTML;
    })
    deleteBtnHandler();
}