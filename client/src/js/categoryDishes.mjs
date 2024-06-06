import { MENU_ROUTE, basicUrlForStatic } from "../utils/const.js";
import { fetchCategoryDataById } from "../js/admin/pages/categoryPage.mjs"

document.addEventListener("DOMContentLoaded", async function () {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    const categoryId = urlParams.get('categoryId');
    const res = await fetchCategoryDataById(categoryId)
    // console.log(res)
    createDishCard(res);

    document.querySelector('.home-button').addEventListener('click', e => {
        e.preventDefault();
        window.location.href = `index.html?id=${id}`
    })

    document.querySelector('.basket-button').addEventListener('click', e => {
        e.preventDefault();
        window.location.href = `basket.html?id=${id}`
    })

    document.querySelector('.order-button').addEventListener('click', e => {
        e.preventDefault();
        window.location.href = `orders.html?id=${id}`
    })
})

function createDishCard(categoryDishes) {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    
    const cardsContainer = document.querySelector('.portfolio-cards-wrapper')
    console.log(categoryDishes)
    document.querySelector('.section-header').textContent = 'Category ' + categoryDishes.category.name
    categoryDishes.dishes.forEach(e => {
        const card = document.createElement('div')
        const basicRef = document.createElement('a')
        basicRef.setAttribute('href', `dish.html?id=${id}&dishId=${e.id}`)
        card.setAttribute('class', 'card')
        const img = document.createElement('img');
        img.setAttribute('class', 'card-image')
        img.setAttribute('src', `${basicUrlForStatic}/static/${e.img}`)
        img.setAttribute('alt', 'Category item')
        const title = document.createElement('h3')
        title.setAttribute('class', 'card-title')
        const ref = document.createElement('a')
        ref.setAttribute('href', `dish.html?id=${id}&dishId=${e.id}`)
        ref.setAttribute('class', 'card1-title-style')
        ref.textContent = e.name;
        const description = document.createElement('p')
        description.textContent = e.description
        title.appendChild(ref)
        basicRef.appendChild(img)
        basicRef.appendChild(title)
        basicRef.appendChild(description)
        card.appendChild(basicRef)
        cardsContainer.appendChild(card)
    })
}