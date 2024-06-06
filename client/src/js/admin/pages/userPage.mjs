import { USER_ROUTE } from "../../../utils/const.js";
import { getToken } from "../../reg.js";

const main = document.querySelector('.main_container');
const token = getToken();

export async function user() {
    try {
        const userData = await fetchUserData();
        console.log(userData)
        let userRows = ''
        main.innerHTML = '';
        userData.rows.forEach(element => {
            const createdAt = new Date(element.createdAt);
            const formattedCreatedAt = `${createdAt.getDate()}.${createdAt.getMonth() + 1}.${createdAt.getFullYear()} 
            ${createdAt.getHours()}:${createdAt.getMinutes()}`;

            userRows += `
            <tr>
                <td class="column">${element.id}</td>
                <td class="column">${element.name}</td>
                <td class="column">${element.email}</td>
                <td class="column">${element.role}</td>
                <td class="column">${formattedCreatedAt}</td>
                <td class="column">
                    <button class="delete" data-id="${element.id}">Del</button>
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
        deleteBtnHandler();
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

function deleteBtnHandler() {
    let feedbackIdForDel = document.querySelectorAll('.delete');
    feedbackIdForDel.forEach(el => {
        el.addEventListener('click', async (e) => {
            e.preventDefault()
            const userId = el.getAttribute('data-id');
            const res = await fetchDeleteUser(userId);
            await user();
        })
    })
}

export async function fetchUserData() {
    const response = await fetch(USER_ROUTE, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
    });

    return response.json();
}

async function fetchUserById() {
    let url
    const userId = document.querySelector('.name_input').value;
    if (userId === '') url = USER_ROUTE
    else url = USER_ROUTE + `/${userId}`
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
    });

    return response.json();
}

async function fetchDeleteUser(userId) {
    console.log(dishId)
    const response = await fetch(USER_ROUTE + `/${userId}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
    });

    return response.json();
}

async function updateUserTable(userData) {
    const userTableBody = document.querySelector('.dishTable_body');
    userTableBody.innerHTML = '';

    const createdAt = new Date(userData.createdAt);
    const formattedCreatedAt = `${createdAt.getDate()}.${createdAt.getMonth() + 1}.${createdAt.getFullYear()} 
        ${createdAt.getHours()}:${createdAt.getMinutes()}`;

    const rowHTML = `
        <tr class="table_row" data-bs-toggle="modal" data-bs-target="#detailInfoModal">
            <td class="column">${userData.id}</td>
            <td class="column">${userData.name}</td>
            <td class="column">${userData.email}</td>
            <td class="column">${userData.role}</td>
            <td class="column">${formattedCreatedAt}</td>
            <td class="column">
                <button class="delete" data-id="${userData.id}">Del</button>
            </td>
        </tr>`;
    userTableBody.innerHTML += rowHTML;

    deleteBtnHandler();
}