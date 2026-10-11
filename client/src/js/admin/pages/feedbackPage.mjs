import { FEEDBACK_ROUTE } from "../../../utils/const.js";
import { escapeHtml, formatDate } from "../../../utils/helpers.js";
import { api } from "../../../utils/apiClient.js";

const main = document.querySelector('.main_container');

export async function feedback() {
    try {
        const feedbackData = await fetchFeedbackData();
        console.log(feedbackData)
        let feedbackRows = ''
        main.innerHTML = '';
        feedbackData.rows.forEach(element => {
            const formattedCreatedAt = formatDate(element.createdAt);

            feedbackRows += `
            <tr>
                <td class="column">${escapeHtml(element.id)}</td>
                <td class="column">${escapeHtml(element.text)}</td>
                <td class="column">${escapeHtml(element.user?.name)}</td>
                <td class="column">${escapeHtml(element.userId)}</td>
                <td class="column">${escapeHtml(element.user?.email)}</td>
                <td class="column">${escapeHtml(element.dish?.name)}</td>
                <td class="column">${escapeHtml(element.dishId)}</td>
                <td class="column">${formattedCreatedAt}</td>
                <td class="column">
                    <button class="delete" data-id="${escapeHtml(element.userId)}" data-dish-id="${escapeHtml(element.dishId)}">Del</button>
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
        setupTableDelegation();

    } catch (e) {
        console.error('Error retrieving information for feedback: ', e.message);
    }
}

function submitBtnHandler() {
    document.getElementById('submit_btn').addEventListener('click', async (e) => {
        e.preventDefault();
        const res = await fetchFeedbacksByDishId();
        updateOrderTable(res);
    });
}

function setupTableDelegation() {
    const tableBody = document.querySelector('.dishTable_body');
    if (tableBody) {
        tableBody.addEventListener('click', async (e) => {
            const delBtn = e.target.closest('.delete');
            if (delBtn) {
                e.preventDefault();
                const userId = delBtn.getAttribute('data-id');
                const dishId = delBtn.getAttribute('data-dish-id');
                await fetchDeleteFeedback(userId, dishId);
                await feedback();
            }
        });
    }
}

export async function fetchFeedbackData() {
    return api.get(FEEDBACK_ROUTE);
}

async function fetchFeedbacksByDishId() {
    const dishId = document.querySelector('.name_input').value;
    const url = dishId ? `${FEEDBACK_ROUTE}/${encodeURIComponent(dishId)}` : FEEDBACK_ROUTE;
    return api.get(url);
}

async function fetchDeleteFeedback(userId, dishId) {
    return api.delete(`${FEEDBACK_ROUTE}/${encodeURIComponent(userId)}`, {
        body: JSON.stringify({ dishId })
    });
}

async function updateOrderTable(dishFeedbackData) {
    const orderTableBody = document.querySelector('.dishTable_body');
    orderTableBody.innerHTML = '';
    dishFeedbackData.rows.forEach(async element => {
        const formattedCreatedAt = formatDate(element.createdAt);

        const rowHTML = `
        <tr class="table_row" data-bs-toggle="modal" data-bs-target="#detailInfoModal">
            <td class="column">${escapeHtml(element.id)}</td>        
            <td class="column">${escapeHtml(element.text)}</td>    
            <td class="column">${escapeHtml(element.user?.name)}</td>    
            <td class="column">${escapeHtml(element.userId)}</td>    
            <td class="column">${escapeHtml(element.user?.email)}</td>    
            <td class="column">${escapeHtml(element.dish?.name)}</td>    
            <td class="column">${escapeHtml(element.dishId)}</td>    
            <td class="column">${formattedCreatedAt}</td>    
            <td class="column">    
                <button class="delete" data-id="${escapeHtml(element.userId)}" data-dish-id="${escapeHtml(element.dishId)}">Del</button>
            </td>    
        </tr>`;
        orderTableBody.innerHTML += rowHTML;
    })
    deleteBtnHandler();
}