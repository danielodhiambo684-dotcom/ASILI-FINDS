
document.addEventListener("DOMContentLoaded", function () {

    // =====================================
    // 1. ELEMENTS AND STORAGE
    // =====================================

    const STORAGE_KEY = "asiliFindsProducts";

    const productForm = document.getElementById("productForm");
    const productImage = document.getElementById("productImage");
    const previewImage = document.getElementById("previewImage");
    const imagePreview = document.getElementById("imagePreview");
    const inventoryTable = document.getElementById("inventoryTable");
    const recentProductsTable = document.getElementById("recentProductsTable");
    const toast = document.getElementById("toast");

    let selectedImage = "";
    let products = loadProducts();

    function loadProducts() {
        try {
            const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
            return Array.isArray(saved) ? saved : [];
        } catch (error) {
            console.error("Could not load products:", error);
            return [];
        }
    }

    function saveProducts() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
            return true;
        } catch (error) {
            console.error("Could not save products:", error);
            showToast("Storage is full. Try using smaller images.");
            return false;
        }
    }

    // =====================================
    // 2. SAFE HTML AND NOTIFICATIONS
    // =====================================

    function escapeHTML(value) {
        return String(value ?? "").replace(/[&<>"']/g, character => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        })[character]);
    }

    function formatMoney(amount) {
        return "KSh " + Number(amount).toLocaleString("en-KE", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }

    function showToast(message) {
        toast.textContent = message;
        toast.classList.add("show");

        clearTimeout(window.asiliToastTimer);

        window.asiliToastTimer = setTimeout(() => {
            toast.classList.remove("show");
        }, 3000);
    }

    // =====================================
    // 3. PAGE NAVIGATION
    // =====================================

    const navigationButtons = document.querySelectorAll(".nav-link");
    const pages = document.querySelectorAll(".page");
    const pageTitle = document.getElementById("pageTitle");
    const sidebar = document.getElementById("sidebar");

    function openPage(pageId) {
        pages.forEach(page => {
            page.classList.toggle("active", page.id === pageId);
        });

        navigationButtons.forEach(button => {
            button.classList.toggle(
                "active",
                button.dataset.page === pageId
            );
        });

        const titles = {
            dashboardPage: "Dashboard",
            inventoryPage: "Inventory",
            addProductPage: "Add Product"
        };

        pageTitle.textContent = titles[pageId] || "Dashboard";

        sidebar.classList.remove("open");

        if (pageId === "dashboardPage" || pageId === "inventoryPage") {
            refreshDashboard();
        }
    }

    navigationButtons.forEach(button => {
        button.addEventListener("click", function () {
            openPage(button.dataset.page);
        });
    });

    document.querySelectorAll("[data-open-page]").forEach(button => {
        button.addEventListener("click", function () {
            resetForm();
            openPage(button.dataset.openPage);
        });
    });

    document.getElementById("menuToggle").addEventListener("click", function () {
        sidebar.classList.toggle("open");
    });

    // =====================================
    // 4. PRODUCT IMAGE PREVIEW
    // =====================================

    productImage.addEventListener("change", function () {
        const file = productImage.files[0];

        if (!file) return;

        if (!file.type.startsWith("image/")) {
            showToast("Please select a valid image.");
            productImage.value = "";
            return;
        }

        // Limit image size to 2 MB for browser storage.
        if (file.size > 2 * 1024 * 1024) {
            showToast("Image is too large. Maximum size is 2 MB.");
            productImage.value = "";
            return;
        }

        const reader = new FileReader();

        reader.onload = function (event) {
            selectedImage = event.target.result;

            previewImage.src = selectedImage;
            imagePreview.classList.add("show");
        };

        reader.onerror = function () {
            showToast("Could not read the selected image.");
        };

        reader.readAsDataURL(file);
    });

    // =====================================
    // 5. RESET PRODUCT FORM
    // =====================================

    function resetForm() {
        productForm.reset();

        document.getElementById("productId").value = "";
        document.getElementById("formHeading").textContent = "Add New Product";
        document.getElementById("saveProductBtn").textContent = "Save Product";

        selectedImage = "";
        productImage.value = "";

        previewImage.src = "";
        imagePreview.classList.remove("show");
    }

    document.getElementById("cancelForm").addEventListener("click", function () {
        resetForm();
        openPage("inventoryPage");
    });

    // =====================================
    // 6. SAVE OR UPDATE PRODUCT
    // =====================================

    productForm.addEventListener("submit", function (event) {
        event.preventDefault();

        const id = document.getElementById("productId").value;
        const name = document.getElementById("productName").value.trim();
        const category = document.getElementById("productCategory").value;
        const price = Number(document.getElementById("productPrice").value);
        const stock = Number(document.getElementById("productStock").value);
        const description = document.getElementById("productDescription").value.trim();

        const existingProduct = id
            ? products.find(product => String(product.id) === id)
            : null;

        const image = selectedImage || existingProduct?.image || "";

        if (!name || !category || !description || !image) {
            showToast("Please complete all fields and add a product image.");
            return;
        }

        if (!Number.isFinite(price) || price <= 0) {
            showToast("Enter a valid product price.");
            return;
        }

        if (!Number.isInteger(stock) || stock < 0) {
            showToast("Enter a valid stock quantity.");
            return;
        }

        const productData = {
            id: id || String(Date.now()),
            name,
            category,
            price,
            stock,
            description,
            image,
            updatedAt: new Date().toISOString()
        };

        if (existingProduct) {
            products = products.map(product =>
                String(product.id) === id ? productData : product
            );
        } else {
            productData.createdAt = new Date().toISOString();
            products.unshift(productData);
        }

        if (!saveProducts()) return;

        showToast(existingProduct
            ? "Product updated successfully!"
            : "Product added successfully!"
        );

        resetForm();
        refreshDashboard();
        openPage("inventoryPage");
    });

    // =====================================
    // 7. PRODUCT STOCK STATUS
    // =====================================

    function getStockStatus(stock) {
        if (stock <= 0) {
            return '<span class="status out">Out of Stock</span>';
        }

        if (stock <= 5) {
            return '<span class="status low">Low Stock</span>';
        }

        return '<span class="status available">Available</span>';
    }

    // =====================================
    // 8. DISPLAY INVENTORY
    // =====================================

    function renderInventory() {
        const searchTerm = document
            .getElementById("inventorySearch")
            .value.toLowerCase().trim();

        const selectedCategory = document
            .getElementById("inventoryCategory")
            .value;

        const filteredProducts = products.filter(product => {
            const matchesSearch =
                product.name.toLowerCase().includes(searchTerm) ||
                product.description.toLowerCase().includes(searchTerm) ||
                product.category.toLowerCase().includes(searchTerm);

            const matchesCategory =
                !selectedCategory || product.category === selectedCategory;

            return matchesSearch && matchesCategory;
        });

        if (!filteredProducts.length) {
            inventoryTable.innerHTML = `
                <tr>
                    <td colspan="6" class="empty-state">
                        ${products.length
                            ? "No matching products found."
                            : "No products available. Add your first product."}
                    </td>
                </tr>
            `;
            return;
        }

        inventoryTable.innerHTML = filteredProducts.map(product => `
            <tr>
                <td>
                    <div class="product-cell">
                        <img src="${escapeHTML(product.image)}"
                             alt="${escapeHTML(product.name)}">
                        <div>
                            <strong>${escapeHTML(product.name)}</strong>
                            <small>${escapeHTML(product.description.substring(0, 35))}${product.description.length > 35 ? "..." : ""}</small>
                        </div>
                    </div>
                </td>

                <td>${escapeHTML(product.category)}</td>

                <td>${formatMoney(product.price)}</td>

                <td>${product.stock}</td>

                <td>${getStockStatus(product.stock)}</td>

                <td>
                    <div class="action-buttons">
                        <button class="edit-btn" data-edit="${escapeHTML(product.id)}">
                            Edit
                        </button>

                        <button class="delete-btn" data-delete="${escapeHTML(product.id)}">
                            Delete
                        </button>
                    </div>
                </td>
            </tr>
        `).join("");
    }

    // Search and category filtering.
    document.getElementById("inventorySearch").addEventListener("input", renderInventory);

    document.getElementById("inventoryCategory").addEventListener("change", renderInventory);

    // =====================================
    // 9. EDIT AND DELETE PRODUCTS
    // =====================================

    inventoryTable.addEventListener("click", function (event) {

        const editButton = event.target.closest("[data-edit]");
        const deleteButton = event.target.closest("[data-delete]");

        if (editButton) {
            editProduct(editButton.dataset.edit);
        }

        if (deleteButton) {
            deleteProduct(deleteButton.dataset.delete);
        }
    });

    function editProduct(id) {
        const product = products.find(item => String(item.id) === String(id));

        if (!product) return;

        document.getElementById("productId").value = product.id;
        document.getElementById("productName").value = product.name;
        document.getElementById("productCategory").value = product.category;
        document.getElementById("productPrice").value = product.price;
        document.getElementById("productStock").value = product.stock;
        document.getElementById("productDescription").value = product.description;

        selectedImage = product.image;

        previewImage.src = product.image;
        imagePreview.classList.add("show");

        document.getElementById("formHeading").textContent = "Edit Product";
        document.getElementById("saveProductBtn").textContent = "Update Product";

        openPage("addProductPage");
    }

    function deleteProduct(id) {
        const product = products.find(item => String(item.id) === String(id));

        if (!product) return;

        const confirmed = confirm(
            "Are you sure you want to delete " + product.name + "?"
        );

        if (!confirmed) return;

        products = products.filter(item => String(item.id) !== String(id));

        if (!saveProducts()) return;

        refreshDashboard();
        showToast("Product deleted successfully!");
    }

    // =====================================
    // 10. DASHBOARD STATISTICS
    // =====================================

    function refreshDashboard() {
        const totalProducts = products.length;

        const totalStock = products.reduce(
            (total, product) => total + Number(product.stock),
            0
        );

        const inventoryValue = products.reduce(
            (total, product) =>
                total + (Number(product.price) * Number(product.stock)),
            0
        );

        const lowStock = products.filter(
            product => Number(product.stock) <= 5
        ).length;

        document.getElementById("totalProducts").textContent = totalProducts;

        document.getElementById("totalStock").textContent =
            totalStock.toLocaleString("en-KE");

        document.getElementById("inventoryValue").textContent =
            formatMoney(inventoryValue);

        document.getElementById("lowStock").textContent = lowStock;

        renderInventory();
        renderRecentProducts();
    }

    // =====================================
    // 11. RECENT PRODUCTS
    // =====================================

    function renderRecentProducts() {
        const recentProducts = products.slice(0, 5);

        if (!recentProducts.length) {
            recentProductsTable.innerHTML = `
                <tr>
                    <td colspan="5" class="empty-state">
                        No products added yet.
                    </td>
                </tr>
            `;
            return;
        }

        recentProductsTable.innerHTML = recentProducts.map(product => `
            <tr>
                <td>
                    <div class="product-cell">
                        <img src="${escapeHTML(product.image)}"
                             alt="${escapeHTML(product.name)}">
                        <strong>${escapeHTML(product.name)}</strong>
                    </div>
                </td>

                <td>${escapeHTML(product.category)}</td>

                <td>${formatMoney(product.price)}</td>

                <td>${product.stock}</td>

                <td>${getStockStatus(product.stock)}</td>
            </tr>
        `).join("");
    }

    // =====================================
    // 12. INITIALISE DASHBOARD
    // =====================================

    refreshDashboard();

    console.log("ASILI FINDS Admin Panel loaded successfully.");

});


const productForm = document.getElementById("productForm");

productForm.addEventListener("submit", function(e) {
    e.preventDefault();

    const imageFile = document.getElementById("productImage").files[0];

    if (!imageFile) {
        alert("Please select a product image.");
        return;
    }

    const reader = new FileReader();

    reader.onload = function() {
        const product = {
            id: Date.now(),
            name: document.getElementById("productName").value,
            category: document.getElementById("productCategory").value,
            price: Number(document.getElementById("productPrice").value),
            stock: Number(document.getElementById("productStock").value),
            description: document.getElementById("productDescription").value,
            image: reader.result
        };

        let products = JSON.parse(
            localStorage.getItem("asiliFindsProducts")
        ) || [];

        products.push(product);

        localStorage.setItem(
            "asiliFindsProducts",
            JSON.stringify(products)
        );

        alert("Product added successfully!");

        productForm.reset();
    };

    reader.readAsDataURL(imageFile);
});
