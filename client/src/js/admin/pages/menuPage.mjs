import { MENU_ROUTE, basicUrlForStatic } from "../../../utils/const.js";
import { getToken } from "../../reg.js";

const main = document.querySelector('.main_container');
const token = getToken();

export async function menu() {
    try {
        const menuData = await fetchMenuData();
        let menuRows = ''
        main.innerHTML = '';
        menuData.rows.forEach(element => {
            const categories = element.categories.map(category => category.name).join(', ');
            const createdAt = new Date(element.createdAt);
            const updatedAt = new Date(element.updatedAt);
            const formattedCreatedAt = `${createdAt.getDate()}.${createdAt.getMonth() + 1}.${createdAt.getFullYear()} 
            ${createdAt.getHours()}:${createdAt.getMinutes()}`;
            const formattedUpdatedAt = `${updatedAt.getDate()}.${updatedAt.getMonth() + 1}.${updatedAt.getFullYear()} 
            ${updatedAt.getHours()}:${updatedAt.getMinutes()}`;

            const imageUrl = `${basicUrlForStatic}/static/${element.img}`;

            menuRows += `
            <tr>
                <td class="column">${element.id}</td>
                <td class="column">${element.name}</td>
                <td class="column">${categories}</td>
                <td class="column">${formattedCreatedAt}</td>
                <td class="column">
                    <img class="image_table" src="${imageUrl}" alt="${element.name}"></img>
                </td>
                <!--<td class="column">${formattedUpdatedAt}</td>-->
                <td class="column">
                    <button class="delete" data-id="${element.id}">Del</button>
                    <button class="update" data-id="${element.id}" data-bs-toggle="modal" data-bs-target=".edit-modal">Edit</button>
                </td>
            </tr>
        `;
        });

        const menuHTML = `
            <div class="create_container">
                    <div class="input-form">
                    
                        <h1 class="create">Create menu</h1>

                        <label for="name_input" class="name_text">Name</label>
                        <input type="text" class="name_input">

                        <label for="description_input" class="description_text">Description</label>
                        <input type="text" class="description_input">

                        <div class="buttons">
                            <label for="image_selection" class="image">Select a image</label>
                            <input type="file" accept="image/jpg" class="image_selection" id="image_selection">
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
                                        <th class="column">Menu name</th>
                                        <th class="column">Categories</th>
                                        <th class="column">Created at</th>
                                        <th class="column">Image</th>
                                        <th class="column">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${menuRows}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
                <div class="modal fade edit-modal" tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
                    <div class="modal-dialog">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h1 class="modal-title fs-5" id="exampleModalLabel">Edit menu</h1>
                                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div class="modal-body">
                                <form id="uploadForm">
                                    <div class="mb-3">
                                        <label for="recipient-name" class="col-form-label">Name:</label>
                                        <input type="text" class="form-control" id="recipient-name">
                                    </div>
                                    <div class="mb-3">
                                        <label for="message-text" class="col-form-label">Description:</label>
                                        <textarea class="form-control" id="message-text"></textarea>
                                    </div>
                                    <div class="mb-3">
                                        <label for="uploadImage" class="form-label">Select Image File</label>
                                        <input class="form-control" type="file" id="uploadImage" name="uploadImage" accept="image/jpg"
                                            required multiple>
                                    </div>
                                    <input type="hidden" id="selectedImageData" name="selectedImageData">
                                </form>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                                <button type="button" class="btn btn-primary" id="applyButton">Apply</button>
                            </div>
                        </div>
                    </div>
    `
        main.innerHTML += menuHTML;

        document.getElementById('submit_btn').addEventListener('click', async (e) => {
            e.preventDefault();
            const res = await fetchCreateMenu();
            await menu();
            // console.log(res);
        });

        let menuIdForDel = document.querySelectorAll('.delete');
        menuIdForDel.forEach(el => {
            el.addEventListener('click', async (e) => {
                e.preventDefault()
                const menuId = el.getAttribute('data-id');
                await fetchDeleteMenu(menuId);
                await menu();
            })
        })

        addEventListenersForUpdate(menuData);
    } catch (e) {
        console.error('Error retrieving information for menu: ', e.message);
    }
}

export async function fetchMenuData() {
    const response = await fetch(MENU_ROUTE, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
    });
    
    return response.json();
}

async function fetchCreateMenu() {
    const name = document.querySelector('.name_input').value;
    const description = document.querySelector('.description_input').value;
    const img = document.querySelector('.image_selection');

    const formData = new FormData();
    formData.append('name', name);
    formData.append('description', description);
    if (img.files.length > 0)
        formData.append('img', img.files[0]);
    else {
        alert('You have not selected an image')
        return
    }

    console.log('fd: ' + formData);
    const response = await fetch(MENU_ROUTE, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`
        },
        body: formData,
    });

    return response.json();
}

async function fetchDeleteMenu(menuId) {
    const response = await fetch(MENU_ROUTE + `/${menuId}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
    });
    return response.json();
}

function addEventListenersForUpdate(menuData) {
    let menuIdForUpd = document.querySelectorAll('.update');
    menuIdForUpd.forEach(el => {
        el.addEventListener('click', async (e) => {
            e.preventDefault();
            const menuId = el.getAttribute('data-id');
            const menuElement = menuData.rows.find(item => item.id == menuId);
            if (menuElement) {
                document.querySelector('#recipient-name').value = menuElement.name;
                document.querySelector('#message-text').value = menuElement.description;

                document.getElementById('applyButton').onclick = async (a) => {
                    a.preventDefault();
                    const res = await fetchUpdMenu(menuElement.id);
                    // document.querySelector('.btn-secondary').click();
                    if (res) {
                        const modal = document.querySelector('.edit-modal');
                        const bsModal = bootstrap.Modal.getInstance(modal);
                        bsModal.hide();
                        await menu();
                    }
                };
            }
        });
    });
}

async function fetchUpdMenu(menuId) {
    const name = document.getElementById('recipient-name').value;
    const description = document.getElementById('message-text').value;
    const image = document.getElementById('uploadImage').files[0];
    let img;

    const formData = new FormData();
    formData.append('name', name);
    formData.append('description', description);
    if (image) img = image;

    // for (let [key, value] of formData.entries()) {
    //     console.log(`${key}: ${value}`);
    // }
    const response = await fetch(MENU_ROUTE + `/${menuId}`, {
        method: 'PATCH',
        headers: {
            // 'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: formData,
        files: img,
    });

    return response.json();
}