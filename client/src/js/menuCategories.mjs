import { MENU_ROUTE, basicUrlForStatic } from "../utils/const.js";


document.addEventListener("DOMContentLoaded", async function () {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    await fetchOneMenuData();

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

    const links = document.querySelectorAll("a");
    links.forEach((link) => {
        link.addEventListener("click", function (e) {
            if (this.target === "_blank") {
                return;
            }
            e.preventDefault();
            const target = this.getAttribute("href");

            document.body.classList.add("fade-out");

            setTimeout(() => {
                if (target !== window.location.href) {
                    window.location.href = target;
                } else {
                    document.body.classList.remove("fade-out");
                }
            }, 500);
        });
    });
})


async function fetchOneMenuData() {
    const urlParams = new URLSearchParams(window.location.search);
    const menuId = urlParams.get('menuId');
    console.log(menuId)
    const response = await fetch(MENU_ROUTE + `/${menuId}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    createMenusCard(await response.json())
}

function createMenusCard(menu) {
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('id');

    document.querySelector('.section-header').textContent = 'Menu ' + menu.name
    const cardsContainer = document.querySelector('.portfolio-cards-wrapper')
    menu.categories.forEach(e => {
        console.log(e.id)
        const card = document.createElement('div')
        const basicRef = document.createElement('a')
        basicRef.setAttribute('href', `categoryDishes.html?id=${userId}&categoryId=${e.id}`)
        card.setAttribute('class', 'card')
        const img = document.createElement('img');
        img.setAttribute('class', 'card-image')
        img.setAttribute('src', `${basicUrlForStatic}/static/${e.img}`)
        img.setAttribute('alt', 'Category item')
        const title = document.createElement('h3')
        title.setAttribute('class', 'card-title')
        const ref = document.createElement('a')
        ref.setAttribute('href', `categoryDishes.html?id=${userId}&categoryId=${e.id}`)
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