import { basicUrlForStatic, CATEGORY_ROUTE, DISH_ROUTE } from "../../../utils/const.js";
import { getToken } from "../../reg.js";
import { fetchCategoryData } from "../pages/categoryPage.mjs";


const main = document.querySelector('.main_container');
let dropdownMenu = document.querySelectorAll('.dropdown-menu');
let chosedCategory = {};
let dishRows = '';

const token = getToken();

export async function dish() {
    try {
        const dishData = await fetchDishData();
        console.log(dishData);
        main.innerHTML = '';
        dishRows = ''
        dishData.rows.forEach(element => {
            const createdAt = new Date(element.createdAt);
            const updatedAt = new Date(element.updatedAt);
            const formattedCreatedAt = `${createdAt.getDate()}.${createdAt.getMonth() + 1}.${createdAt.getFullYear()} 
            ${createdAt.getHours()}:${createdAt.getMinutes()}`;
            const formattedUpdatedAt = `${updatedAt.getDate()}.${updatedAt.getMonth() + 1}.${updatedAt.getFullYear()} 
            ${updatedAt.getHours()}:${updatedAt.getMinutes()}`;

            const imageUrl = `${basicUrlForStatic}/static/${element.img}`;

            dishRows += `
            <tr>
                <td class="column">${element.id}</td>
                <td class="column">${element.name}</td>
                <td class="column">${element.price}</td>
                <td class="column">${element.rating}</td>
                <td class="column">${element.description}</td>
                <td class="column">${element.category.name}</td>
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

        const dishHTML = `
        <div class="create_container">
                    <div class="input-form">
                        <h1 class="create">Create dish</h1>
                        <div class="dropdown_container">
                            <label for="name_input" class="name_text">Name</label>
                            <input type="text" class="name_input">
                            <div class="dropdown">
                                <button class="btn btn-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                                    Choose category
                                </button>
                                <ul class="dropdown-menu category"></ul>
                            </div>
                            <div>
                                <b>Chosed category:</b>
                                <b class="choosedMenu"></b>
                            </div>
                        </div>
                        <label for="description_input" class="description_text">Description</label>
                        <input type="text" class="description_input">

                        <label for="price_input" class="price_text">Price</label>
                        <input type="text" class="price_input">
                        <div class="buttons">
                            <label for="image_selection" class="image">Select a image</label>
                            <input type="file" accept="image/jpg" class="image_selection" id="image_selection">
                            <button type="button" id="submit_btn">Submit</button>
                        </div>
                    </div>
                </div>
                <!--  <div class="options_container">
                    <button class="sortByPrice_btn">Sort by price</button>
                    <button class="sortByRating_btn">Sort by rating</button>
                </div> -->
                <div class="options_container">
                    <div class="btn-group dropend">
                        <button type="button" class="btn btn-secondary dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false">
                            Sort by price
                        </button>
                        <ul class="dropdown-menu">
                            <li><a class="dropdown-item" id="sort-price-asc" href="#">Sort by price ascending</a></li>
                            <li><a class="dropdown-item" id="sort-price-desc" href="#">Sort by price descending</a></li>
                        </ul>
                    </div>
                    <div class="btn-group dropend">
                        <button type="button" class="btn btn-secondary dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false">
                            Sort by rating
                        </button>
                        <ul class="dropdown-menu">
                            <li><button class="dropdown-item" id="sort-rating-asc" href="#">Sort by rating ascending</button></li>
                            <li><button class="dropdown-item" id="sort-rating-desc" href="#">Sort by rating descending</button></li>
                        </ul>
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
                                        <th class="column" id="sort-price">Price</th>
                                        <th class="column" id="sort-rating">Rating</th>
                                        <th class="column">Description</th>
                                        <th class="column">Category name</th>
                                        <th class="column">Created</th>
                                        <th class="column">Image</th>
                                        <th class="column">Actions</th>
                                    </tr>
                                </thead>
                                <tbody class="dishTable_body">
                                    ${dishRows}
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
                                        <label for="price-text" class="col-form-label">Price:</label>
                                        <input type="text" class="form-control" id="price-text">
                                    </div>
                                    <div class="mb-3">
                                        <label for="menu_name" class="col-form-label">Category:</label>
                                        <div class="dropdown">
                                            <button class="btn btn-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                                                Choose category
                                            </button>
                                            <ul class="dropdown-menu category">
                                                
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
        main.innerHTML += dishHTML;
        document.querySelector('#sort-price-asc').addEventListener('click', async () => {
            await sortDishes('price', 'ASC');
        });

        document.querySelector('#sort-price-desc').addEventListener('click', async () => {
            await sortDishes('price', 'DESC');
        });

        document.querySelector('#sort-rating-asc').addEventListener('click', async () => {
            await sortDishes('rating', 'ASC');
        });

        document.querySelector('#sort-rating-desc').addEventListener('click', async () => {
            await sortDishes('rating', 'DESC');
        });

        // updateDishRows(dishData);
        await getCategories();
        dropdownHandler();
        submitBtnHandler();
        deleteDishHandler();
        await addEventListenersForUpdate(dishData);
    } catch (e) {
        console.error('Error retrieving information for dish: ', e.message);
    }
}

async function getCategories() {
    const categories = await fetchCategoryData();
    categories.rows.forEach(e => {
        e.name
        const li = document.createElement('li')
        const link = document.createElement('a');
        link.href = '#';
        link.dataset.id = e.id;
        link.classList.add('dropdown-item');
        const name = document.createTextNode(e.name);
        link.appendChild(name);
        li.appendChild(link);

        document.querySelectorAll('.dropdown-menu.category').forEach(dropdown => {
            const liClone = li.cloneNode(true);
            dropdown.appendChild(liClone);
        });
    })
}

function dropdownHandler() {
    document.querySelectorAll('.dropdown-item')
        .forEach(e => e.addEventListener('click', async (event) => {
            event.preventDefault();
            chosedCategory.name = e.textContent;
            chosedCategory.id = e.dataset.id;
            document.querySelector('.choosedMenu').textContent = chosedCategory.name;
            document.getElementById('menu_name').value = chosedCategory.name;//e.textContent;
            // console.log(chosedCategory);
        }))
}

function submitBtnHandler() {
    document.getElementById('submit_btn').addEventListener('click', async (e) => {
        try {
            e.preventDefault();
            if (!chosedCategory.id) {
                alert('Please choose a category');
                return;
            }
            const res = await fetchCreateDish();
            // await category();
            console.log(res);
        } catch (e) {
            console.log('Something wrong: ' + e)
        }
    });
}

function deleteDishHandler() {
    let dishIdForDel = document.querySelectorAll('.delete');
    dishIdForDel.forEach(el => {
        el.addEventListener('click', async (e) => {
            e.preventDefault()
            const dishId = el.getAttribute('data-id');
            await fetchDeleteDish(dishId);
            await dish();
        })
    })
}

async function addEventListenersForUpdate(dishData) {
    // await getMenus()
    let dishIdForUpd = document.querySelectorAll('.update');
    dishIdForUpd.forEach(el => {
        el.addEventListener('click', async (e) => {
            e.preventDefault();
            const dishId = el.getAttribute('data-id');
            const dishElement = dishData.rows.find(item => item.id == dishId);
            if (dishElement) {
                // console.log(dishElement)
                document.querySelector('#recipient-name').value = dishElement.name;
                document.querySelector('#message-text').value = dishElement.description;
                document.querySelector('#price-text').value = dishElement.price;
                document.querySelector('#menu_name').value = dishElement.category.name;

                document.getElementById('applyButton').onclick = async (a) => {
                    a.preventDefault();
                    if (!chosedCategory.id) {
                        alert('Please choose a category');
                        return;
                    }
                    const res = await fetchUpdDish(dishElement.id);
                    console.log(res)
                    if (res) {
                        const modal = document.querySelector('.edit-modal');
                        const bsModal = bootstrap.Modal.getInstance(modal);
                        bsModal.hide();
                        await dish();
                    }
                };
            }
        });
    });
}

async function fetchDishData() {
    const response = await fetch(DISH_ROUTE, {//(`${DISH_ROUTE}?sort=${sortField}&dir=ASC`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
    });

    return response.json();
}

async function fetchCreateDish() {
    try {
        const name = document.querySelector('.name_input').value;
        const description = document.querySelector('.description_input').value;
        const price = document.querySelector('.price_input').value;
        console.log(price)
        const img = document.querySelector('.image_selection');

        const formData = new FormData();
        formData.append('name', name);
        formData.append('description', description);
        formData.append('price', price);
        if (!chosedCategory.id)
            formData.append('categoryId', document.getElementById('price-text').value);
        else formData.append('categoryId', chosedCategory.id);
        if (img.files.length > 0)
            formData.append('img', img.files[0]);
        // else {
        //     alert('You have not selected an image')
        //     return
        // }

        const response = await fetch(DISH_ROUTE, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData,
        });

        return response.json();
    } catch (e) {
        console.log('Something wrong: ' + e)
    }
}

async function fetchDeleteDish(dishId) {
    const response = await fetch(DISH_ROUTE + `/${dishId}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
    });

    return response.json();
}

async function fetchUpdDish(dishId) {
    const name = document.getElementById('recipient-name').value;
    const description = document.getElementById('message-text').value;
    const price = document.getElementById('price-text').value;
    const image = document.getElementById('uploadImage').files[0];
    let img;

    const formData = new FormData();
    formData.append('name', name);
    formData.append('price', price);
    formData.append('description', description);
    formData.append('categoryId', chosedCategory.id);
    console.log(chosedCategory.id)
    if (image) img = image;

    // for (let [key, value] of formData.entries()) {
    //     console.log(`${key}: ${value}`);
    // }
    const response = await fetch(DISH_ROUTE + `/${dishId}`, {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${token}`
        },
        body: formData,
        files: img,
    });

    return response.json();
}


function updateDishRows(sortedData) {
    dishRows = ''
    sortedData.rows.forEach(element => {
        const createdAt = new Date(element.createdAt);
        const formattedCreatedAt = `${createdAt.getDate()}.${createdAt.getMonth() + 1}.${createdAt.getFullYear()} 
        ${createdAt.getHours()}:${createdAt.getMinutes()}`;
        const imageUrl = `${basicUrlForStatic}/static/${element.img}`;

        dishRows += `
        <tr>
            <td class="column">${element.id}</td>
            <td class="column">${element.name}</td>
            <td class="column">${element.price}</td>
            <td class="column">${element.rating}</td>
            <td class="column">${element.description}</td>
            <td class="column">${element.category.name}</td>
            <td class="column">${formattedCreatedAt}</td>
            <td class="column">
                <img class="image_table" src="${imageUrl}" alt="${element.name}"></img>
            </td>
            <td class="column">
                <button class="delete" data-id="${element.id}">Del</button>
                <button class="update" data-id="${element.id}" data-bs-toggle="modal" data-bs-target=".edit-modal">Edit</button>
            </td>
        </tr>
        `;
    });

    const dishTableBody = document.querySelector('.dishTable_body');
    if (dishTableBody) {
        dishTableBody.innerHTML = dishRows;
    } else {
        console.error('.dishTable_body element not found');
    }
}

async function sortDishes(sort, dir) {
    try {
        const response = await fetch(`${DISH_ROUTE}?sort=${sort}&dir=${dir}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
        });
        const sortedData = await response.json();
        console.log(sortedData)
        updateDishRows(sortedData);
    } catch (error) {
        console.error('Error fetching sorted data: ', error);
    }
}