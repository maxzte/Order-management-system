import { login } from "./reg.js";
import { REGISTRATION_ROUTE, LOGIN_ROUTE } from '../utils/const.js'

const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');

loginForm.addEventListener('submit', function (event) {
    event.preventDefault();
    checkLoginFormInputs();
});

signupForm.addEventListener('submit', function (event) {
    event.preventDefault();
    checkSignUpFormFormInputs();
});

function checkLoginFormInputs() {
    const emailValue = loginForm.querySelector('.Email').value.trim();
    const passwordValue = loginForm.querySelector('.Password').value.trim();
    const emailField = loginForm.querySelector('.Email');
    const passwordField = loginForm.querySelector('.Password');

    if (emailValue === '') setError(emailField, 'Email cannot be blank');
    else if (!isEmail(emailValue)) setError(emailField, 'Not a valid email');
    else setSuccess(emailField);

    if (passwordValue === '') setError(passwordField, 'Password cannot be blank');
    else if (!isPass(passwordValue)) setError(passwordField, 'Password isn`t valid!')
    else setSuccess(passwordField);

    fetchData(LOGIN_ROUTE, emailValue, passwordValue);
}

function checkSignUpFormFormInputs() {
    const emailValue = signupForm.querySelector('.Email').value.trim();
    const passwordValue = signupForm.querySelector('.Password').value.trim();
    const confirmPasswordValue = signupForm.querySelector('.ConfirmPassword').value.trim();
    const emailField = signupForm.querySelector('.Email');
    const passwordField = signupForm.querySelector('.Password');
    const confirmPasswordField = signupForm.querySelector('.ConfirmPassword');

    if (emailValue === '') setError(emailField, 'Email cannot be blank');
    else if (!isEmail(emailValue)) setError(emailField, 'Not a valid email');
    else setSuccess(emailField);

    if (passwordValue === '') setError(passwordField, 'Password cannot be blank');
    if (confirmPasswordValue === '') setError(confirmPasswordField, 'Confirm password field cannot be blank')
    else if (!isPass(passwordValue)) setError(passwordField, 'Password isn`t valid!');
    else if (!isPass(confirmPasswordValue)) setError(confirmPasswordField, 'Confirm password field isn`t valid!');
    else if (passwordValue !== confirmPasswordValue) setError(confirmPasswordField, 'Different passwords')
    else {
        setSuccess(confirmPasswordField);
        setSuccess(passwordField);

        fetchData(REGISTRATION_ROUTE, emailValue, passwordValue);
    }
}

function setError(input, msg) {
    const formField = input.parentElement;
    const small = formField.querySelector('small');
    formField.className = 'input-field error';
    small.innerText = msg;
    setFieldError(input);
}

function setSuccess(input) {
    const formField = input.parentElement;
    const small = formField.querySelector('small');
    formField.className = 'input-field success';
    small.innerText = '';
    setFieldSuccess(input);
}

function isEmail(email) {
    return /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(email);
}

function isPass(password) {
    return /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/.test(password);
}

const forms = document.querySelector('.forms'),
    links = document.querySelectorAll('.link');

links.forEach(link => {
    link.addEventListener("click", (event) => {
        event.preventDefault();
        forms.classList.toggle("show-signup");
    });
});

function setFieldError(input) {
    input.classList.remove('success');
    input.classList.add('error');
}

function setFieldSuccess(input) {
    input.classList.remove('error');
    input.classList.add('success');
}

async function fetchData(url, email, password) {
    const data = { email, password, };
    const result = await login(url, data);
    if (result.role === 'ADMIN') {
        console.log('res')
        console.log(result)
        window.location.href = `admin.html`;
    } else if(result.role === 'USER'){
        window.location.href = `index.html?id=${result.id}`;
    }
    // else console.error('Login failed:', await result.json());
}