import { DISH_ROUTE, FEEDBACK_ROUTE, BASKET_ROUTE, basicUrlForStatic } from "../utils/const.js";
import { formatDate, setupHeaderNavigation } from "../utils/helpers.js";
import { api } from "../utils/apiClient.js";

document.addEventListener("DOMContentLoaded", async function () {
    await fetchOneDishData();
    const comments = await getCommentsByDishId();
    createCommentsList(comments);

    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    setupHeaderNavigation(id);
});

async function fetchOneDishData() {
    const urlParams = new URLSearchParams(window.location.search);
    const dishId = urlParams.get('dishId');
    const data = await api.get(DISH_ROUTE + `/${dishId}`);
    createDishCard(data);
}

async function postComment() {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    const dishId = urlParams.get('dishId');
    const text = document.getElementById('review').value;
    await api.post(FEEDBACK_ROUTE + `/${id}`, { dishId, text });
    const comments = await getCommentsByDishId();
    createCommentsList(comments);
}

async function getCommentsByDishId() {
    const urlParams = new URLSearchParams(window.location.search);
    const dishId = urlParams.get('dishId');
    return api.get(FEEDBACK_ROUTE + `/${dishId}`);
}

async function addItemToBasket() {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    const dishId = urlParams.get('dishId');
    const quantity = document.getElementById('quantity').textContent;
    return api.post(BASKET_ROUTE + `/addDishes/${id}`, { dishId, quantity });
}

function createDishCard(dish) {
    document.querySelector('.project1-header').textContent = dish.name
    document.querySelector('.description').textContent = dish.description
    document.querySelector('.card-image')
        .setAttribute('src', `${basicUrlForStatic}/static/${dish.img}`)
}

function createCommentsList(comments) {
    const commentsContainer = document.getElementById('reviews-list')
    commentsContainer.innerHTML = ''
    comments.rows.forEach(c => {
        const formattedCreatedAt = formatDate(c.createdAt);

        const userInfoContainer = document.createElement('div')
        userInfoContainer.setAttribute('class', 'user-info_container')
        const name = document.createElement('span')
        name.setAttribute('class', 'name')
        name.textContent = c.user.name
        const email = document.createElement('span')
        email.setAttribute('class', 'email')
        email.textContent = c.user.email
        const dateTime = document.createElement('span')
        dateTime.setAttribute('class', 'dateTime')
        dateTime.textContent = formattedCreatedAt

        const commentContainer = document.createElement('div')
        commentContainer.setAttribute('class', 'comment_container')
        commentContainer.textContent = c.text

        userInfoContainer.appendChild(name)
        userInfoContainer.appendChild(email)
        userInfoContainer.appendChild(dateTime)

        commentsContainer.appendChild(userInfoContainer)
        commentsContainer.appendChild(commentContainer)
    })
}

document.addEventListener("DOMContentLoaded", (event) => {
    const increaseButton = document.getElementById("increase");
    const decreaseButton = document.getElementById("decrease");
    const quantityDisplay = document.getElementById("quantity");

    let quantity = 0;

    increaseButton.addEventListener("click", () => {
        quantity++;
        updateQuantityDisplay();
    });

    decreaseButton.addEventListener("click", () => {
        if (quantity > 0) {
            quantity--;
            updateQuantityDisplay();
        }
    });

    function updateQuantityDisplay() {
        quantityDisplay.textContent = quantity;
    }
});

document.getElementById('addToBasket').addEventListener('click', async (e) => {
    e.preventDefault()
    const res = await addItemToBasket()
    console.log(res)
})

document.getElementById('submit-review').addEventListener('click', async (e) => {
    e.preventDefault()
    const res = await postComment();
    console.log(res)
})