import { MENU_ROUTE, basicUrlForStatic } from "../utils/const.js";
import { fetchCategoryDataById } from "../js/admin/pages/categoryPage.mjs";
import { setupHeaderNavigation } from "../utils/helpers.js";

document.addEventListener("DOMContentLoaded", async function () {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    const categoryId = urlParams.get('categoryId');
    const res = await fetchCategoryDataById(categoryId);
    createDishCard(res);
    setupHeaderNavigation(id);
});

function createDishCard(categoryDishes) {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    
    const cardsContainer = document.querySelector('.portfolio-cards-wrapper')
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
        img.setAttribute('loading', 'lazy')
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