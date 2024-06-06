document.addEventListener("DOMContentLoaded", () => {
  const cartTable = document.getElementById("cartTable");
  const cartTotal = document.getElementById("cartTotal");
  const increaseButtons = cartTable.querySelectorAll(".increase-quantity");
  const decreaseButtons = cartTable.querySelectorAll(".decrease-quantity");
  const checkoutButton = document.getElementById("checkoutButton");

  let sortDirection = {
    dish: 1,
    price: 1,
    quantity: 1,
    total: 1,
  };

  function updateCartTotal() {
    let total = 0;
    const totals = cartTable.querySelectorAll(".total");
    totals.forEach((totalElement) => {
      total += parseFloat(totalElement.textContent);
    });
    cartTotal.textContent = total.toFixed(2);
  }

  function sortTable(column, direction) {
    const rowsArray = Array.from(cartTable.tBodies[0].rows);
    let index;

    switch (column) {
      case "dish":
        index = 0;
        break;
      case "price":
        index = 1;
        break;
      case "quantity":
        index = 2;
        break;
      case "total":
        index = 3;
        break;
    }

    rowsArray.sort((a, b) => {
      const aText = a.cells[index].innerText.replace("$", "").trim();
      const bText = b.cells[index].innerText.replace("$", "").trim();

      const aValue = isNaN(aText) ? aText : parseFloat(aText);
      const bValue = isNaN(bText) ? bText : parseFloat(bText);

      if (aValue < bValue) return -1 * direction;
      if (aValue > bValue) return 1 * direction;
      return 0;
    });

    rowsArray.forEach((row) => cartTable.tBodies[0].appendChild(row));
  }

  increaseButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const quantityElement = button.parentElement.querySelector(".quantity");
      const totalElement =
        button.parentElement.parentElement.querySelector(".total");
      const price = parseFloat(
        button.parentElement.parentElement.cells[1].textContent.replace("$", "")
      );
      let quantity = parseInt(quantityElement.textContent);
      quantity++;
      quantityElement.textContent = quantity;
      totalElement.textContent = (price * quantity).toFixed(2);
      updateCartTotal();
    });
  });

  decreaseButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const quantityElement = button.parentElement.querySelector(".quantity");
      const totalElement =
        button.parentElement.parentElement.querySelector(".total");
      const price = parseFloat(
        button.parentElement.parentElement.cells[1].textContent.replace("$", "")
      );
      let quantity = parseInt(quantityElement.textContent);
      if (quantity > 0) {
        quantity--;
        quantityElement.textContent = quantity;
        totalElement.textContent = (price * quantity).toFixed(2);
        updateCartTotal();
      }
    });
  });

  checkoutButton.addEventListener("click", () => {
    const order = {
      orderNumber: Date.now(),
      items: [],
      totalCost: parseFloat(cartTotal.textContent),
    };

    const rows = cartTable.querySelectorAll("tbody tr");
    rows.forEach((row) => {
      const dish = row.cells[0].textContent;
      const price = parseFloat(row.cells[1].textContent.replace("$", ""));
      const quantity = parseInt(row.querySelector(".quantity").textContent);
      if (quantity > 0) {
        order.items.push({ name: dish, quantity, price });
      }
    });

    let orders = JSON.parse(localStorage.getItem("orders")) || [];
    orders.push(order);
    localStorage.setItem("orders", JSON.stringify(orders));

    alert("Order placed successfully!");
  });

  headers.forEach((header) => {
    header.addEventListener("click", () => {
      const column = header.dataset.column;
      sortTable(column, sortDirection[column]);
      sortDirection[column] *= -1;
    });
  });
});
