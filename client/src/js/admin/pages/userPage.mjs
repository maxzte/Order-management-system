import { USER_ROUTE } from "../../../utils/const.js";
import { escapeHtml, formatDate } from "../../../utils/helpers.js";
import { api } from "../../../utils/apiClient.js";

const main = document.querySelector('.main_container');

export async function user() {
    try {
        const userData = await fetchUserData();
        console.log(userData)
        let userRows = ''
        main.innerHTML = '';
        userData.rows.forEach(element => {
            const formattedCreatedAt = formatDate(element.createdAt);

            userRows += `
            <tr>
                <td class="column">${escapeHtml(element.id)}</td>
                <td class="column">${escapeHtml(element.name)}</td>
                <td class="column">${escapeHtml(element.email)}</td>
                <td class="column">${escapeHtml(element.role)}</td>
                <td class="column">${formattedCreatedAt}</td>
                <td class="column">
                    <button class="delete" data-id="${escapeHtml(element.id)}">Del</button>
                </td>
            </tr>
        `;
        });

        const userHTML = `
            <div class="create_container">
                <div class="input-form">
                    <h1 class="create">Find user by userId</h1>
                    <label for="name_input" class="name_text">UserId</label>
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
                                    <th class="column">Name</th>
                                    <th class="column">Email</th>
                                    <th class="column">Role</th>
                                    <th class="column">Created at</th>
                                    <th class="column">Actions</th>
                                </tr>
                            </thead>
                            <tbody class="dishTable_body">
                                ${userRows}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
    `
        main.innerHTML += userHTML;
        submitBtnHandler();
        setupTableDelegation();
    } catch (e) {
        console.error('Error retrieving information for menu: ', e.message);
    }
}

function submitBtnHandler() {
    document.getElementById('submit_btn').addEventListener('click', async (e) => {
        e.preventDefault();
        const res = await fetchUserById();
        if (!res.rows) updateUserTable(res)
        else await user();
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
                await fetchDeleteUser(userId);
                await user();
            }
        });
    }
}

export async function fetchUserData() {
    return api.get(USER_ROUTE);
}

async function fetchUserById() {
    const userId = document.querySelector('.name_input').value;
    const url = userId === '' ? USER_ROUTE : `${USER_ROUTE}/${encodeURIComponent(userId)}`;
    return api.get(url);
}

async function fetchDeleteUser(userId) {
    return api.delete(`${USER_ROUTE}/${encodeURIComponent(userId)}`);
}

async function updateUserTable(userData) {
    const userTableBody = document.querySelector('.dishTable_body');
    userTableBody.innerHTML = '';

    const formattedCreatedAt = formatDate(userData.createdAt);

    const rowHTML = `
        <tr class="table_row" data-bs-toggle="modal" data-bs-target="#detailInfoModal">
            <td class="column">${escapeHtml(userData.id)}</td>
            <td class="column">${escapeHtml(userData.name)}</td>
            <td class="column">${escapeHtml(userData.email)}</td>
            <td class="column">${escapeHtml(userData.role)}</td>
            <td class="column">${formattedCreatedAt}</td>
            <td class="column">
                <button class="delete" data-id="${escapeHtml(userData.id)}">Del</button>
            </td>
        </tr>`;
    userTableBody.innerHTML += rowHTML;

    deleteBtnHandler();
}