import { DISH_ROUTE, FEEDBACK_ROUTE, BASKET_ROUTE, basicUrlForStatic } from "../utils/const.js";


document.addEventListener("DOMContentLoaded", async function () {

    await fetchOneDishData();
    const comments = await getCommentsByDishId();

    createCommentsList(comments);
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id')

    const orderBtn = document.querySelector('.order-button');
    orderBtn.addEventListener('click', (e)=>{
        e.preventDefault()
        window.location.href = `orders.html?id=${id}`
    })

    const basketBtn = document.querySelector('.basket-button');
    basketBtn.addEventListener('click', (e)=>{
        e.preventDefault()
        window.location.href = `basket.html?id=${id}`
    })

    const homeBtn = document.querySelector('.home-button');
    homeBtn.addEventListener('click', (e)=>{
        e.preventDefault()
        window.location.href = `index.html?id=${id}`
    })
})

async function fetchOneDishData() {
    const urlParams = new URLSearchParams(window.location.search);
    const dishId = urlParams.get('dishId');
    const response = await fetch(DISH_ROUTE + `/${dishId}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    createDishCard(await response.json())
}

async function postComment() {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    const dishId = urlParams.get('dishId');
    const text = document.getElementById('review').value
    const response = await fetch(FEEDBACK_ROUTE + `/${id}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 'dishId': dishId, 'text': text })
    })

    if (response.ok) {
        const comments = await getCommentsByDishId()
        createCommentsList(comments);
    }
    // return await response.json();
}

async function getCommentsByDishId() {
    const urlParams = new URLSearchParams(window.location.search);
    const dishId = urlParams.get('dishId');
    const response = await fetch(FEEDBACK_ROUTE + `/${dishId}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    })

    return await response.json();
}

async function addItemToBasket() {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    const dishId = urlParams.get('dishId');
    const quantity = document.getElementById('quantity').textContent
    const response = await fetch(BASKET_ROUTE + `/addDishes/${id}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 'dishId': dishId, 'quantity': quantity })
    })

    return await response.json();
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
        const createdAt = new Date(c.createdAt);
        const formattedCreatedAt = `${createdAt.getDate()}.${createdAt.getMonth() + 1}.${createdAt.getFullYear()} 
            ${createdAt.getHours()}:${createdAt.getMinutes()}`;

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