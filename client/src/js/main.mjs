import { fetchMenuData } from "./admin/pages/menuPage.mjs";
import { basicUrlForStatic } from "../utils/const.js";


window.addEventListener('load', function () {
    window.scrollTo(0, 0);
});

document.addEventListener("DOMContentLoaded", async function () {
    document.body.classList.add("fade-in");
    const arrow = document.querySelector(".header-arrow");
    arrow.addEventListener("click", function () {
        const container = document.querySelector(".portfolio");
        if (container) {
            container.scrollIntoView({
                behavior: "smooth"
            });
        } else {
            console.error("Element with class 'container' not found.");
        }
    });

    const menus = await fetchMenuData()

    createMenusCard(menus);
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id')

    const orderBtn = document.querySelector('.order-button');
    orderBtn.addEventListener('click', (e) => {
        e.preventDefault()
        window.location.href = `orders.html?id=${id}`
    })

    const basketBtn = document.querySelector('.basket-button');
    basketBtn.addEventListener('click', (e) => {
        e.preventDefault()
        window.location.href = `basket.html?id=${id}`
    })
});

function createMenusCard(menus) {
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('id');

    const cardsContainer = document.querySelector('.portfolio-cards-wrapper')
    menus.rows.forEach(e => {
        const card = document.createElement('div')
        const basicRef = document.createElement('a')
        basicRef.setAttribute('href', `menuCategories.html?id=${userId}&menuId=${e.id}`)
        card.setAttribute('class', 'card')
        const img = document.createElement('img');
        img.setAttribute('class', 'card-image')
        img.setAttribute('src', `${basicUrlForStatic}/static/${e.img}`)
        img.setAttribute('alt', 'Menu item')
        const title = document.createElement('h3')
        title.setAttribute('class', 'card-title')
        const ref = document.createElement('a')
        ref.setAttribute('href', `menuCategories.html?id=${userId}&menuId=${e.id}`)
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

