import { basicUrlForStatic, CATEGORY_ROUTE } from "../../../utils/const.js";
import { getToken } from "../../reg.js";
import { fetchMenuData } from "../pages/menuPage.mjs";


const main = document.querySelector('.main_container');
let dropdownMenu = document.querySelectorAll('.dropdown-menu');
let chosedMenu = {};
const token = getToken();

export async function category() {
    try {
        const categoryData = await fetchCategoryData();
        console.log(categoryData);
        main.innerHTML = '';
        let categoryRows = ''
        categoryData.rows.forEach(element => {
            const createdAt = new Date(element.createdAt);
            const updatedAt = new Date(element.updatedAt);
            const formattedCreatedAt = `${createdAt.getDate()}.${createdAt.getMonth() + 1}.${createdAt.getFullYear()} 
            ${createdAt.getHours()}:${createdAt.getMinutes()}`;
            const formattedUpdatedAt = `${updatedAt.getDate()}.${updatedAt.getMonth() + 1}.${updatedAt.getFullYear()} 
            ${updatedAt.getHours()}:${updatedAt.getMinutes()}`;

            const imageUrl = `${basicUrlForStatic}/static/${element.img}`;

            categoryRows += `
            <tr>
                <td class="column">${element.id}</td>
                <td class="column">${element.name}</td>
                <td class="column">${element.menu.name}</td>
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

        const categoryHTML = `
        <div class="create_container">
                    <div class="input-form">
                    
                        <h1 class="create">Create category</h1>
                        <div class="dropdown_container">
                            <label for="name_input" class="name_text">Name</label>
                            <input type="text" class="name_input">
                            <div class="dropdown">
                                <button class="btn btn-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                                    Choose menu
                                </button>
                                <ul class="dropdown-menu">
                                    
                                </ul>
                            </div>
                            <div>
                                <b>Chosed menu:</b>
                                <b class="choosedMenu"></b>
                            </div>
                        </div>

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
                                        <th class="column">Category name</th>
                                        <th class="column">Menu name</th>
                                        <!--<th class="column">Category name</th>-->
                                        <th class="column">Created at</th>
                                        <th class="column">Image</th>
                                        <th class="column">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${categoryRows}
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
                                        <label for="recipient-name" class="col-form-label">Name:</label>
                                        <input type="text" class="form-control" id="recipient-name">
                                    </div>
                                    <div class="mb-3">
                                        <label for="menu_name" class="col-form-label">Menu name:</label>
                                        <div class="dropdown">
                                            <button class="btn btn-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                                                Choose menu
                                            </button>
                                            <ul class="dropdown-menu">
                                                
                                            </ul>
                                        </div>
                                        <input type="text" class="form-control" id="menu_name">
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
        main.innerHTML += categoryHTML;
        
        await getMenus();
        dropdownHandler();
        submitBtnHandler();
        deleteCategoryHandler();
        await addEventListenersForUpdate(categoryData);
    } catch (e) {
        console.error('Error retrieving information for category: ', e.message);
    }
}

async function getMenus() {

    const menus = await fetchMenuData();
    menus.rows.forEach(e => {
        e.name
        const li = document.createElement('li')
        const link = document.createElement('a');
        link.href = '#';
        link.dataset.id = e.id;
        link.classList.add('dropdown-item');
        const name = document.createTextNode(e.name);
        link.appendChild(name);
        li.appendChild(link);

        document.querySelectorAll('.dropdown-menu').forEach(dropdown => {
            const liClone = li.cloneNode(true);
            dropdown.appendChild(liClone);
        });
    })
}

function dropdownHandler() {
    document.querySelectorAll('.dropdown-item')
        .forEach(e => e.addEventListener('click', async (event) => {
            event.preventDefault();
            chosedMenu.name = e.textContent;
            chosedMenu.id = e.dataset.id;
            document.querySelector('.choosedMenu').textContent = chosedMenu.name;
            document.getElementById('menu_name').value = chosedMenu.name;//e.textContent;
            // console.log(chosedMenu);
        }))
}

function submitBtnHandler() {
    document.getElementById('submit_btn').addEventListener('click', async (e) => {
        e.preventDefault();
        const res = await fetchCreateCategory();
        // await category();
        console.log(res);
    });
}

function deleteCategoryHandler() {
    let categoryIdForDel = document.querySelectorAll('.delete');
    categoryIdForDel.forEach(el => {
        el.addEventListener('click', async (e) => {
            e.preventDefault()
            const categoryId = el.getAttribute('data-id');
            await fetchDeleteCategory(categoryId);
            await category();
        })
    })
}

async function addEventListenersForUpdate(categoryData) {
    // await getMenus()
    let menuIdForUpd = document.querySelectorAll('.update');
    menuIdForUpd.forEach(el => {
        el.addEventListener('click', async (e) => {
            e.preventDefault();
            const categoryId = el.getAttribute('data-id');
            const categoryElement = categoryData.rows.find(item => item.id == categoryId);
            if (categoryElement) {
                document.querySelector('#recipient-name').value = categoryElement.name;
                document.querySelector('#message-text').value = categoryElement.description;
                document.querySelector('#menu_name').value = categoryElement.menu.name;

                document.getElementById('applyButton').onclick = async (a) => {
                    a.preventDefault();
                    const res = await fetchUpdCategory(categoryElement.id);
                    // document.querySelector('.btn.btn-secondary').click();
                    if (res) {
                        const modal = document.querySelector('.edit-modal');
                        const bsModal = bootstrap.Modal.getInstance(modal);
                        bsModal.hide();
                        await category();
                    }
                };
            }
        });
    });
}

export async function fetchCategoryData() {
    const response = await fetch(CATEGORY_ROUTE, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
    });

    return response.json();
}

export async function fetchCategoryDataById(categoryId) {
    const response = await fetch(CATEGORY_ROUTE + `/${categoryId}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
    });

    return response.json();
}

async function fetchCreateCategory() {
    const name = document.querySelector('.name_input').value;
    const description = document.querySelector('.description_input').value;
    const img = document.querySelector('.image_selection');

    const formData = new FormData();
    formData.append('name', name);
    formData.append('description', description);
    formData.append('menuId', chosedMenu.id);
    if (img.files.length > 0)
        formData.append('img', img.files[0]);
    else {
        alert('You have not selected an image')
        return
    }

    const response = await fetch(CATEGORY_ROUTE, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`
        },
        body: formData,
    });

    return response.json();
}

async function fetchDeleteCategory(categoryId) {
    const response = await fetch(CATEGORY_ROUTE + `/${categoryId}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
    });

    return response.json();
}

async function fetchUpdCategory(categoryId) {
    const name = document.getElementById('recipient-name').value;
    const description = document.getElementById('message-text').value;
    const image = document.getElementById('uploadImage').files[0];
    let img;

    const formData = new FormData();
    formData.append('name', name);
    formData.append('description', description);
    formData.append('menuId', chosedMenu.id);
    if (image) img = image;

    // for (let [key, value] of formData.entries()) {
    //     console.log(`${key}: ${value}`);
    // }
    const response = await fetch(CATEGORY_ROUTE + `/${categoryId}`, {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${token}`
        },
        body: formData,
        files: img,
    });

    return response.json();
}