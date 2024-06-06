import { dashboard } from './pages/dashboardPage.mjs';
import { menu } from './pages/menuPage.mjs';
import { category } from './pages/categoryPage.mjs';
import { dish } from './pages/dishPage.mjs';
import { order } from './pages/orderPage.mjs';
import { feedback } from './pages/feedbackPage.mjs';
import { user } from './pages/userPage.mjs';
const navLogo = document.querySelector('.nav_logo');
let title = document.querySelector('.header_title');

document.addEventListener("DOMContentLoaded", async function (event) {
    await dashboard();
    title.textContent = 'Dashboard';
    const showNavbar = (toggleId, navId, bodyId, headerId) => {
        const toggle = document.getElementById(toggleId),
            nav = document.getElementById(navId),
            bodypd = document.getElementById(bodyId),
            headerpd = document.getElementById(headerId)

        // Validate that all variables exist
        if (toggle && nav && bodypd && headerpd) {
            toggle.addEventListener('click', () => {
                // show navbar
                nav.classList.toggle('show')
                // change icon
                toggle.classList.toggle('bx-x')
                // add padding to body
                bodypd.classList.toggle('body-pd')
                // add padding to headerА
                headerpd.classList.toggle('body-pd')
            })
        }
    }
    showNavbar('header-toggle', 'nav-bar', 'body-pd', 'header')

    /*===== LINK ACTIVE =====*/

    navLogo.addEventListener('click', async (event) => {
        event.preventDefault()
        if (event) window.location.href = 'index.html';
    })

    let links;
    if (document.querySelectorAll('.nav_link')) links = document.querySelectorAll('.nav_link');
    else links = document.querySelectorAll('.nav_link.active');

    function colorLink(event) {
        if (links) {
            links.forEach(l => l.classList.remove('active'));
            event.currentTarget.classList.add('active');
        }
    }

    links.forEach(l => l.addEventListener('click', async (event) => {
        event.preventDefault();
        colorLink(event);
        const targetClassList = event.currentTarget.querySelector('i').classList;

        if (title) {
            const navNameElement = event.currentTarget.querySelector('.nav_name');
            if (navNameElement && navNameElement.textContent != 'SignOut')
                title.textContent = navNameElement.textContent;
        }

        if (targetClassList.contains('bx-grid-alt'))
            await dashboard();
        else if (targetClassList.contains('bx-food-menu'))
            await menu();
        else if (targetClassList.contains('bx-category'))
            await category();
        else if (targetClassList.contains('bx-dish'))
            await dish();
        else if (targetClassList.contains('bx-message-square-detail'))
            await order();
        else if (targetClassList.contains('bx-comment'))
            await feedback();
        else if (targetClassList.contains('bx-user'))
            await user();
        else if (targetClassList.contains('bx-log-out'))
            window.location.href = 'register_form.html';
    }));
});

title.addEventListener('click', async () => window.scrollTo({ top: 0, left: 0, behavior: 'smooth' }));


