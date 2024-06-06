
export const login = async (url, data) => {
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });
    // console.log(response.json())
    if (response.ok) {
        const result = await response.json();
        console.log('res')
        console.log(result)
        localStorage.setItem('token', result.token);
        // return true;
        return result;
    } else return false;
}

export function getToken() {
    return localStorage.getItem('token');
}