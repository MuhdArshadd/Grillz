document.addEventListener("DOMContentLoaded", () => {
  fetchMenuData();
});

function fetchMenuData() {
  fetch('../../controller_php/menuController.php', {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ action: "getMenu" }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        renderMenu(data.menu);
      } else {
        console.error("Failed to load menu:", data.message);
      }
    })
    .catch((error) => console.error("Fetch error:", error));
}

function renderMenu(menuItems) {
  const container = document.getElementById("menu-container");
  container.innerHTML = ""; // Clear existing content

  const categories = ["Burger", "Wings"]; // Predefined categories

  categories.forEach((category) => {
    const catHeader = document.createElement("h3");
    catHeader.className = "text-brown-dark mt-4";
    catHeader.textContent = category;
    container.appendChild(catHeader);

    const row = document.createElement("div");
    row.className = "row g-4";

    const items = menuItems.filter((item) => item.category === category);

    if (items.length === 0) {
      const noItems = document.createElement("p");
      noItems.textContent = "No items in this category.";
      container.appendChild(noItems);
      return;
    }

    items.forEach((item) => {
      const col = document.createElement("div");
      col.className = "col-md-4";

      const card = `
        <div class="card h-100 shadow-sm border-0 rounded-4">
          <img src="${item.image_src || 'placeholder.jpg'}" class="card-img-top rounded-top-4" alt="${item.name}">
          <div class="card-body text-center">
            <h5 class="card-title text-brown-dark">${item.name}</h5>
            <p class="card-text text-muted">${item.description}</p>
            <p class="price text-orange fw-bold">RM${parseFloat(item.price).toFixed(2)}</p>
            <button class="btn btn-brown" ${item.status === 'out of stock' ? 'disabled' : ''}>
              ${item.status === 'out of stock' ? 'Out of Stock' : 'Order Now'}
            </button>
          </div>
        </div>
      `;
      col.innerHTML = card;
      row.appendChild(col);
    });

    container.appendChild(row);
  });
}
