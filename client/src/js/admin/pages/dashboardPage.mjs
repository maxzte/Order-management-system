import { getToken } from '../../reg.js'
import { DASHBOARD_ROUTE } from '../../../utils/const.js';
import { fetchOrderData } from './orderPage.mjs'


const main = document.querySelector('.main_container');

const token = getToken();
let chartInstance = null;

export async function dashboard() {
    try {
        const dashBoardData = await fetchBasicOrderData();
        main.innerHTML = '';
        const dashboardHTML = `
        <div class="create_container">
            <h1 class="create">Detail info</h1>
                <div class="input-form">
                    <div class="dropdown_container">
                        <label for="name_input" class="name_text">Date period:</label>
                        <input type="text" class="name_input">
                        <div class="dropdown">
                            <button class="btn btn-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                            Choose period
                            </button>
                            <ul class="dropdown-menu category">
                                <li class="dropdown-item">Day</li>
                                <li class="dropdown-item">Week</li>
                                <li class="dropdown-item">Month</li>
                                <li class="dropdown-item">Year</li>
                            </ul>
                        </div>
                        <button id="submit_btn">Apply</button>
                    </div>
                </div>
                <div class="chart_container">
                    <div style="width: 400px;"><canvas id="chart_container"></canvas></div>
                    <div style="width: 400px;"><canvas id="chart_container_total"></canvas></div>
                </div>
        </div>
        <div class="dashboard-container">
            <div class="dashboard-card">
                <h2>Кількість замовлень</h2>
                <p id="total-orders">${dashBoardData.ordersCount}</p>
            </div>
            <div class="dashboard-card">
                <h2>Завершені замовлення</h2>
                <p id="completed-orders">${dashBoardData.salesCount}</p>
                </div>
            <div class="dashboard-card">
                <h2>Кількість користувачів</h2>
                <p id="total-users">${dashBoardData.usersCount}</p>
            </div>
        </div>
            
    `
        main.innerHTML += dashboardHTML;

        dropdownHandler();
        createEmptyChart();
        submitBtnHandler();
        prepareForChartTotal();

    } catch (e) {
        console.error('Error retrieving information for dashboard: ', e.message);
    }
}

function dropdownHandler() {
    document.querySelectorAll('.dropdown-item')
        .forEach(e => e.addEventListener('click', async (event) => {
            event.preventDefault();
            const datePeriod = e.textContent;
            document.querySelector('.name_input').value = e.textContent;
            console.log(datePeriod);
            datePeriodActivator(datePeriod);
        }))
}

function submitBtnHandler() {
    document.getElementById('submit_btn').addEventListener('click', async (e) => {
        e.preventDefault();
        const res = await fetchDateData();
        let data = {};
        res.forEach(dataPoint => {
            const count = dataPoint.count;
            const formattedDate = new Date(dataPoint.createdAt).toISOString().split('T')[0];
            if (data[formattedDate]) data[formattedDate] += count;
            else data[formattedDate] = count;
        });
        const aggregatedData = Object.entries(data).map(([date, count]) => ({
            date,
            count,
        }));
        createChart(aggregatedData);
    });
}

async function datePeriodActivator(event, datePeriod) {
    let selectedDatePeriod;
    if (datePeriod) {
        datePeriod.forEach(l => l.classList.remove('active'));
        event.currentTarget.classList.add('active');
        selectedDatePeriod = event.currentTarget.textContent.trim();
        document.querySelector('.date').textContent = selectedDatePeriod;
    }
}

async function fetchBasicOrderData() {
    const response = await fetch(DASHBOARD_ROUTE, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
    });
    return response.json();
}

async function fetchDateData() {
    let date = document.querySelector('.name_input').value;
    let period = document.querySelector('.name_input').value;
    // let req;
    let req = DASHBOARD_ROUTE + `?period=${period}`;
    // if (date != '') req = DASHBOARD_ROUTE + `?date=${date}&period=${period}`;
    // else req = DASHBOARD_ROUTE + `?period=${period}`;
    const response = await fetch(req, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
    });
    return response.json();
}

function createChart(aggregatedData) {
    if (chartInstance) {
        chartInstance.destroy();
    }
    const ctx = document.getElementById('chart_container').getContext('2d');
    chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: aggregatedData.map(row => row.date),
            datasets: [{
                cubicInterpolationMode: 'monotone',
                label: 'Продажі за обраний період',
                data: aggregatedData.map(row => row.count),
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgba(247, 93, 30, 1)',
                borderWidth: 1.4,
                tension: 0.4,
            }]
        },
        options: {
            scales: {
                x: {
                    beginAtZero: true
                },
                y: {
                    beginAtZero: true,
                    type: 'logarithmic',
                    ticks: {
                        stepSize: 1,
                        callback: function (value) {
                            if (Number.isInteger(value)) {
                                return value;
                            }
                        }
                    }
                }
            }
        }
    });
}

async function prepareForChartTotal() {
    let dataForTotalOrders = await fetchOrderData();
    let secondData = {};
    dataForTotalOrders.rows.forEach(order => {
        const count = 1//order.orderAmount;
        const formattedDate = new Date(order.createdAt).toISOString().split('T')[0];
        if (secondData[formattedDate]) secondData[formattedDate] += count;
        else secondData[formattedDate] = count;
    });
    const aggregatedDataTotal = Object.entries(secondData).map(([date, count]) => ({
        date,
        count,
    }));
    createChartTotal(aggregatedDataTotal);
}

function createChartTotal(aggregatedDataTotal) {
    const ctx = document.getElementById('chart_container_total').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: aggregatedDataTotal.map(row => row.date),
            datasets: [{
                label: 'Продажі за весь час',
                data: aggregatedDataTotal.map(row => row.count),
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgba(71, 35, 217, 1)',
                borderWidth: 1.4,
                tension: 0.1
            }]
        },
        options: {
            scales: {
                x: {
                    beginAtZero: true
                },
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1,
                        callback: function (value) {
                            if (Number.isInteger(value)) {
                                return value;
                            }
                        }
                    }
                }
            }
        }
    });
}

function createEmptyChart() {
    const ctx = document.getElementById('chart_container').getContext('2d');
    chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                cubicInterpolationMode: 'monotone',
                label: 'Продажі за обраний період',
                data: [],
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgba(247, 93, 30, 1)',
                borderWidth: 1.4,
                tension: 0.4,
            }]
        },
        options: {
            scales: {
                x: {
                    beginAtZero: true
                },
                y: {
                    beginAtZero: true,
                    type: 'logarithmic',
                    ticks: {
                        stepSize: 1,
                        callback: function (value) {
                            if (Number.isInteger(value)) {
                                return value;
                            }
                        }
                    }
                }
            }
        }
    });
}