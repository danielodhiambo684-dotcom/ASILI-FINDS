
/* =========================================
   ASILI FINDS - COMPLETE JAVASCRIPT
   Homepage, Category Pages, Admin Products,
   Search, Cart, Accessibility, Feedback
   and Hero Carousel
   ========================================= */


/* =========================================
   1. SHARED CART FUNCTIONS
   ========================================= */

function getCart() {
    try {
        const cart = JSON.parse(localStorage.getItem("cart") || "[]");
        return Array.isArray(cart) ? cart : [];
    } catch (error) {
        console.error("Could not read cart:", error);
        return [];
    }
}

function saveCart(cart) {
    try {
        localStorage.setItem("cart", JSON.stringify(cart));
        updateCartCount();
        return true;
    } catch (error) {
        console.error("Could not save cart:", error);
        alert("Your cart could not be saved. Check your browser storage.");
        return false;
    }
}

function updateCartCount() {
    const counter = document.getElementById("cartCount");

    if (!counter) return;

    const total = getCart().reduce((sum, item) => {
        return sum + Math.max(0, Number(item.quantity) || 0);
    }, 0);

    counter.textContent = total;
    counter.setAttribute("aria-label", total + " items in cart");
}


/* =========================================
   2. CART NOTIFICATION
   ========================================= */

function showCartNotification(message) {
    let notification = document.getElementById("cartNotification");

    if (!notification) {
        notification = document.createElement("div");
        notification.id = "cartNotification";
        notification.className = "cart-notification";
        notification.setAttribute("role", "status");
        notification.setAttribute("aria-live", "polite");
        document.body.appendChild(notification);
    }

    notification.textContent = "✓ " + message;
    notification.classList.add("show");

    clearTimeout(window.cartNotificationTimer);

    window.cartNotificationTimer = setTimeout(() => {
        notification.classList.remove("show");
    }, 3000);
}


/* =========================================
   3. GLOBAL ADD TO CART
   ========================================= */

window.addToCart = function(name, price) {
    try {
        const cart = getCart();

        const cards = Array.from(
            document.querySelectorAll(".product-card")
        );

        const productCard = cards.find(card => {
            const heading = card.querySelector(
                "h2, h3, h4, .product-name, .product-title"
            );

            return heading &&
                heading.textContent.trim() === name;
        });

        const image = productCard?.querySelector("img");
        const description = productCard?.querySelector(".product-description");
        const category = productCard?.querySelector(".product-category");

        const existingProduct = cart.find(item => item.name === name);

        if (existingProduct) {
            existingProduct.quantity =
                (Number(existingProduct.quantity) || 0) + 1;
        } else {
            cart.push({
                name: name,
                price: Number(price),
                quantity: 1,
                image: image?.getAttribute("src") || "",
                description:
                    description?.textContent.trim() ||
                    "Quality product from Asili Finds.",
                category:
                    category?.textContent.trim() ||
                    productCard?.dataset.category ||
                    "General"
            });
        }

        if (saveCart(cart)) {
            showCartNotification(name + " added to your cart!");
        }

    } catch (error) {
        console.error("Cart error:", error);
        alert("Unable to add product. Please try again.");
    }
};


/* =========================================
   4. SEARCH PRODUCTS
   ========================================= */

window.searchProducts = function() {
    const searchInput = document.getElementById("searchInput");
    const searchMessage = document.getElementById("searchMessage");
    const productList = document.getElementById("productList");

    if (!productList) return;

    const searchTerm = searchInput
        ? searchInput.value.trim().toLowerCase()
        : "";

    let visibleCount = 0;

    productList.querySelectorAll(".product-card").forEach(card => {
        const text = card.textContent.toLowerCase();

        const matches = text.includes(searchTerm);

        card.style.display = matches ? "" : "none";

        if (matches) visibleCount++;
    });

    if (searchMessage) {
        searchMessage.textContent =
            visibleCount === 0
                ? "No products found. Try another search."
                : "";
    }
};


/* =========================================
   5. SEARCH FROM ANY PAGE
   ========================================= */

function initializeHeaderSearch() {
    const searchForm = document.getElementById("headerSearchForm");
    const searchInput = document.getElementById("searchInput");

    if (!searchForm || !searchInput) return;

    searchForm.addEventListener("submit", function(event) {
        event.preventDefault();

        const searchTerm = searchInput.value.trim();

        if (!searchTerm) return;

        const isHomePage =
            window.location.pathname.endsWith("index.html") ||
            window.location.pathname.endsWith("/") ||
            window.location.pathname === "";

        if (isHomePage) {
            window.searchProducts();

            const shop = document.getElementById("shop");

            shop?.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        } else {
            window.location.href =
                "index.html?search=" +
                encodeURIComponent(searchTerm) +
                "#shop";
        }
    });

    searchInput.addEventListener("input", function() {
        if (document.getElementById("productList")) {
            window.searchProducts();
        }
    });
}


/* =========================================
   6. LOAD SEARCH FROM URL
   ========================================= */

function loadSearchFromURL() {
    const params = new URLSearchParams(window.location.search);
    const searchTerm = params.get("search");

    if (!searchTerm) return;

    const searchInput = document.getElementById("searchInput");

    if (searchInput) {
        searchInput.value = searchTerm;
    }

    window.searchProducts();

    setTimeout(() => {
        document.getElementById("shop")?.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    }, 300);
}


/* =========================================
   7. CATEGORY PAGE PRODUCT DISPLAY
   ========================================= */

function getCategoryFromPage() {
    const page = window.location.pathname
        .split("/")
        .pop()
        .toLowerCase();

    const categories = {
        "electronics.html": "electronics",
        "kitchen.html": "kitchen",
        "furniture.html": "furniture",
        "beauty.html": "beauty",
        "fashion.html": "fashion",
        "refurbished.html": "refurbished"
    };

    return categories[page] || "";
}


/* =========================================
   8. ADMIN PRODUCTS
   ========================================= */

function displayAdminProducts() {
    const productList = document.getElementById("productList");

    if (!productList) return;

    productList.querySelectorAll(".admin-added-product").forEach(card => {
        card.remove();
    });

    let products = [];

    try {
        products = JSON.parse(
            localStorage.getItem("asiliFindsProducts") || "[]"
        );

        if (!Array.isArray(products)) products = [];

    } catch (error) {
        console.error("Could not load admin products:", error);
        return;
    }

    const categoryNames = {
        "kitchen": "kitchen",
        "electronics": "electronics",
        "furniture": "furniture",
        "home & living": "furniture",
        "beauty": "beauty",
        "fashion": "fashion",
        "refurbished goods": "refurbished",
        "refurbished": "refurbished"
    };

    const currentCategory = getCategoryFromPage();

    products.forEach(product => {
        const normalizedCategory =
            categoryNames[
                String(product.category || "").trim().toLowerCase()
            ] || String(product.category || "").trim().toLowerCase();

        // Show all admin products on the homepage.
        // On a category page, show only matching products.
        if (
            currentCategory &&
            normalizedCategory !== currentCategory
        ) {
            return;
        }

        const card = document.createElement("article");
        card.className = "product-card admin-added-product";
        card.dataset.category = normalizedCategory;

        const imageWrap = document.createElement("div");
        imageWrap.className = "product-image-wrap";

        const badge = document.createElement("span");
        badge.className = "product-badge";
        badge.textContent = "NEW";

        const image = document.createElement("img");
        image.src = product.image || "";
        image.alt = product.name || "Asili Finds product";
        image.loading = "lazy";

        image.onerror = function() {
            this.alt = "Product image unavailable";
        };

        imageWrap.append(badge, image);

        const info = document.createElement("div");
        info.className = "product-info";

        const category = document.createElement("span");
        category.className = "product-category";
        category.textContent = product.category || "General";

        const name = document.createElement("h3");
        name.textContent = product.name || "Unnamed product";

        const description = document.createElement("p");
        description.className = "product-description";
        description.textContent = product.description || "";

        const rating = document.createElement("div");
        rating.className = "product-rating";
        rating.textContent = "New arrival";

        const bottom = document.createElement("div");
        bottom.className = "product-bottom";

        const price = document.createElement("span");
        price.className = "product-price";
        price.textContent =
            "KSh " + Number(product.price || 0).toLocaleString("en-KE");

        const cartButton = document.createElement("button");
        cartButton.type = "button";
        cartButton.className = "add-cart";
        cartButton.setAttribute(
            "aria-label",
            "Add " + (product.name || "product") + " to cart"
        );

        const cartIcon = document.createElement("i");
        cartIcon.className = "fa-solid fa-cart-plus";

        cartButton.appendChild(cartIcon);

        const stock = Number(product.stock);

        if (Number.isFinite(stock) && stock <= 0) {
            cartButton.disabled = true;
            cartButton.title = "Out of stock";
            cartButton.classList.add("out-of-stock");
        } else {
            cartButton.addEventListener("click", function(event) {
                event.stopPropagation();
                window.addToCart(product.name, product.price);
            });
        }

        bottom.append(price, cartButton);
        info.append(category, name, description, rating, bottom);
        card.append(imageWrap, info);

        productList.appendChild(card);
    });

    window.searchProducts();
}


/* =========================================
   9. CATEGORY FILTER BUTTONS
   ========================================= */

function initializeCategoryFilters() {
    const categoryButtons = document.querySelectorAll(
        "[data-category-filter]"
    );

    const productCards = document.querySelectorAll(".product-card");

    if (!categoryButtons.length) return;

    categoryButtons.forEach(button => {
        button.addEventListener("click", function(event) {
            event.preventDefault();

            const selectedCategory =
                this.dataset.categoryFilter.toLowerCase();

            productCards.forEach(product => {
                const productCategory =
                    (product.dataset.category || "").toLowerCase();

                product.style.display =
                    selectedCategory === "all" ||
                    productCategory === selectedCategory
                        ? ""
                        : "none";
            });

            categoryButtons.forEach(btn => {
                btn.classList.remove("active");
            });

            this.classList.add("active");
        });
    });
}


/* =========================================
   10. NEWSLETTER
   ========================================= */

function initializeNewsletter() {
    const form = document.getElementById("newsletterForm");
    const email = document.getElementById("newsletterEmail");
    const message = document.getElementById("newsletterMessage");

    if (!form) return;

    form.addEventListener("submit", function(event) {
        event.preventDefault();

        if (!email || !email.checkValidity()) {
            email?.reportValidity();
            return;
        }

        if (message) {
            message.textContent =
                "Thank you! Email subscriptions are not connected to a mailing service yet.";
        }

        form.reset();
    });
}


/* =========================================
   11. MAIN INITIALIZATION
   ========================================= */

document.addEventListener("DOMContentLoaded", function() {

    updateCartCount();

    displayAdminProducts();

    initializeHeaderSearch();

    loadSearchFromURL();

    initializeCategoryFilters();

    initializeNewsletter();

    console.log("Asili Finds initialized successfully.");
});



/* =========================================
   12. ACCESSIBILITY ASSISTANT
   HANDS-FREE VOICE SHOPPING
   Wake phrase: HELLO ASILI
   ========================================= */

document.addEventListener("DOMContentLoaded", function() {

    const openButton = document.getElementById("accessibilityButton");
    const panel = document.getElementById("accessibilityPanel");
    const closeButton = document.getElementById("closeAccessibility");
    const message = document.getElementById("accessibilityMessage");
    const guideButton = document.getElementById("shoppingGuideButton");
    const guide = document.getElementById("shoppingGuide");
    const increaseText = document.getElementById("increaseText");
    const resetText = document.getElementById("resetText");
    const voiceButton = document.getElementById("startVoiceShopping");

    if (!openButton || !panel) return;

    function announce(text) {
        if (message) message.textContent = text;
    }

    function openPanel() {
        panel.hidden = false;
        openButton.setAttribute("aria-expanded", "true");
        closeButton?.focus();
    }

    function closePanel() {
        panel.hidden = true;
        openButton.setAttribute("aria-expanded", "false");
        openButton.focus();
    }

    openButton.addEventListener("click", function() {
        panel.hidden ? openPanel() : closePanel();
    });

    closeButton?.addEventListener("click", closePanel);

    document.addEventListener("keydown", function(event) {
        if (event.key === "Escape" && !panel.hidden) {
            closePanel();
        }
    });

    guideButton?.addEventListener("click", function() {
        if (!guide) return;

        guide.hidden = !guide.hidden;

        announce(
            guide.hidden
                ? "Shopping guide closed."
                : "Shopping guide opened."
        );
    });

    increaseText?.addEventListener("click", function() {
        document.body.classList.add("large-accessibility-text");
        announce("Larger text enabled.");
    });

    resetText?.addEventListener("click", function() {
        document.body.classList.remove("large-accessibility-text");
        announce("Text size reset.");
    });

    if (!voiceButton) return;

    const SpeechRecognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
        voiceButton.addEventListener("click", function() {
            announce(
                "Voice shopping is not supported by this browser. Please use Chrome or Microsoft Edge."
            );
        });

        return;
    }

    const recognition = new SpeechRecognition();

    recognition.lang = "en-KE";
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    let wakeMode = false;
    let assistantAwake = false;
    let isListening = false;
    let isSpeaking = false;
    let lastProduct = null;

    // START LISTENING
    function startListening() {
        if (!wakeMode || isSpeaking || isListening) return;

        try {
            recognition.start();
        } catch (error) {
            console.warn("Voice recognition:", error);
        }
    }

    // STOP LISTENING
    function stopListening() {
        wakeMode = false;
        assistantAwake = false;
        isListening = false;

        try {
            recognition.stop();
        } catch (error) {
            console.warn(error);
        }

        voiceButton.textContent = "🎙️ Start voice shopping";
        voiceButton.setAttribute("aria-pressed", "false");
    }

    // SPEAK AND RESUME LISTENING
    function speak(text) {
        announce(text);

        if (!("speechSynthesis" in window)) {
            startListening();
            return;
        }

        isSpeaking = true;

        try {
            recognition.stop();
        } catch (error) {
            console.warn(error);
        }

        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = "en-KE";
        utterance.rate = 0.95;
        utterance.pitch = 1;

        utterance.onend = function() {
            isSpeaking = false;

            if (wakeMode) {
                setTimeout(startListening, 500);
            }
        };

        utterance.onerror = function() {
            isSpeaking = false;

            if (wakeMode) {
                setTimeout(startListening, 500);
            }
        };

        window.speechSynthesis.speak(utterance);
    }

    // GET VISIBLE PRODUCTS
    function getVisibleProducts() {
        return Array.from(
            document.querySelectorAll(".product-card")
        ).filter(card => {
            return card.style.display !== "none" &&
                card.offsetParent !== null;
        });
    }

    // GET PRODUCT INFORMATION
    function getProductInfo(card) {
        if (!card) return null;

        const heading = card.querySelector(
            "h2, h3, h4, .product-name, .product-title"
        );

        const price = card.querySelector(".product-price");
        const description = card.querySelector(
            ".product-description"
        );

        return {
            card: card,
            name: heading?.textContent.trim() || "Unknown product",
            price: price?.textContent.trim() || "Price unavailable",
            description:
                description?.textContent.trim() ||
                "No product description is available."
        };
    }

    // READ PRODUCTS AFTER SEARCH
    function readProducts() {
        const products = getVisibleProducts()
            .map(getProductInfo)
            .filter(Boolean);

        if (!products.length) {
            speak("Sorry, I could not find any products. Try another search.");
            return;
        }

        lastProduct = products[0];

        const productNames = products.slice(0, 5).map(
            (product, index) =>
                `Product ${index + 1}: ${product.name}, ${product.price}.`
        );

        speak(
            `I found ${products.length} products. ` +
            productNames.join(" ") +
            " You can say open the first product, or add this to my cart."
        );
    }

    // OPEN A PRODUCT
    function openProduct(product) {
        if (!product) {
            speak("I could not find that product.");
            return;
        }

        const link = product.card.querySelector(
            'a[href*="product.html"]'
        );

        if (link) {
            window.location.href = link.href;
            return;
        }

        const url =
            "product.html?product=" +
            encodeURIComponent(product.name);

        window.location.href = url;
    }

    // ADD PRODUCT TO CART
    function addProductToCart(product) {
        if (!product) {
            speak("Please tell me which product you want to add.");
            return;
        }

        const priceElement =
            product.card.querySelector(".product-price");

        const priceText = priceElement?.textContent || "";
        const numericPrice = Number(
            priceText.replace(/[^\d.]/g, "")
        );

        if (typeof window.addToCart === "function") {
            window.addToCart(product.name, numericPrice);

            speak(
                product.name +
                " has been added to your cart. Would you like anything else?"
            );
        } else {
            speak("Sorry, I could not add that product right now.");
        }
    }

    // READ PRODUCT DESCRIPTION
    function readDescription() {
        let description = "";

        if (lastProduct) {
            description = lastProduct.description;
        }

        if (!description || description.length < 5) {
            const detailDescription = document.querySelector(
                ".product-description, #productDescription, .product-details-description"
            );

            description = detailDescription?.textContent.trim() || "";
        }

        if (!description) {
            speak("I could not find a product description on this page.");
            return;
        }

        speak("Here is the product description. " + description);
    }

    // SEARCH PRODUCTS
    function searchForProduct(term) {
        const searchBox = document.getElementById("searchInput");

        if (!searchBox) {
            window.location.href =
                "index.html?search=" +
                encodeURIComponent(term) +
                "#shop";
            return;
        }

        searchBox.value = term;

        if (typeof window.searchProducts === "function") {
            window.searchProducts();
        }

        document.getElementById("shop")?.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

        setTimeout(readProducts, 500);
    }

    // HANDLE CUSTOMER COMMANDS
    function handleCommand(command) {

        command = command
            .toLowerCase()
            .replace(/[.,!?]/g, "")
            .trim();

        if (!command) return;

        console.log("Asili heard:", command);

        // WAKE WORD
        if (
            command.includes("hello asili") ||
            command.includes("hello ashley")
        ) {
            assistantAwake = true;

            speak(
                "Hello! Welcome to Asili Finds. " +
                "I am your shopping assistant. " +
                "You can shop by saying Electronics, Fashion, " +
                "Home and Living, Beauty, Sports, or Refurbished. " +
                "What would you like to explore today?"
            );

            return;
        }

        // DO NOT PROCESS SHOPPING COMMANDS BEFORE WAKE WORD
        if (!assistantAwake) {
            announce('Say "Hello Asili" to activate your shopping assistant.');
            return;
        }

        // GOODBYE
        if (
            command.includes("goodbye asili") ||
            command.includes("stop listening") ||
            command.includes("turn off voice shopping")
        ) {
            stopListening();
            speak("Goodbye! Thank you for shopping with Asili Finds.");
            return;
        }

        // HELP
        if (
            command === "help" ||
            command.includes("help me") ||
            command.includes("what can you do")
        ) {
            speak(
                "You can say: search for headphones, open electronics, " +
                "open the first product, read the product description, " +
                "add this to my cart, open my cart, go to checkout, " +
                "or go home."
            );
            return;
        }

        // GO HOME
        if (
            command === "go home" ||
            command === "open home" ||
            command === "homepage"
        ) {
            window.location.href = "index.html";
            return;
        }

        // OPEN CART
        if (
            command.includes("open my cart") ||
            command === "open cart" ||
            command === "open my basket" ||
            command === "my cart"
        ) {
            window.location.href = "cart.html";
            return;
        }

        // CHECKOUT
        if (
            command.includes("go to checkout") ||
            command.includes("open checkout") ||
            command.includes("proceed to checkout")
        ) {
            window.location.href = "checkout.html";
            return;
        }

        // CATEGORY NAVIGATION
        const categoryPages = {
            "electronics": "electronics.html",
            "fashion": "fashion.html",
            "beauty": "beauty.html",
            "sports": "sports.html",
            "refurbished": "refurbished.html",
            "refurbished products": "refurbished.html",
            "home and living": "furniture.html",
            "home living": "furniture.html",
            "kitchen": "kitchen.html",
            "furniture": "furniture.html"
        };

        const categoryCommand = command
            .replace(/^(open|show|go to|take me to)\s+/, "")
            .replace(/\s+category$/, "")
            .trim();

        if (categoryPages[categoryCommand]) {
            window.location.href = categoryPages[categoryCommand];
            return;
        }

        // OPEN FIRST PRODUCT
        if (
            command.includes("open the first product") ||
            command.includes("open first product") ||
            command.includes("open the first one")
        ) {
            const products = getVisibleProducts();
            const product = getProductInfo(products[0]);

            if (!product) {
                speak("There are no visible products to open.");
                return;
            }

            openProduct(product);
            return;
        }

        // ADD PRODUCT TO CART
        if (
            command.includes("add this to my cart") ||
            command.includes("add this to cart") ||
            command.includes("add the first product to cart") ||
            command.includes("add first product to cart")
        ) {
            const product =
                lastProduct ||
                getProductInfo(getVisibleProducts()[0]);

            addProductToCart(product);
            return;
        }

        // READ DESCRIPTION
        if (
            command.includes("read the product description") ||
            command.includes("read description") ||
            command.includes("describe this product")
        ) {
            readDescription();
            return;
        }

        // SHOW PRODUCTS
        if (
            command.startsWith("show me ") ||
            command.startsWith("find ") ||
            command.startsWith("search for ") ||
            command.startsWith("search ") ||
            command.startsWith("look for ")
        ) {
            const term = command.replace(
                /^(show me|search for|search|find|look for)\s+/,
                ""
            ).trim();

            if (term) {
                searchForProduct(term);
            } else {
                speak("Please tell me which product you are looking for.");
            }

            return;
        }

        // OPEN A PRODUCT BY NAME
        if (
            command.startsWith("open product ") ||
            command.startsWith("open ")
        ) {
            const productName = command
                .replace(/^open product\s+/, "")
                .replace(/^open\s+/, "")
                .trim();

            const matchingCard = getVisibleProducts().find(card => {
                const product = getProductInfo(card);

                return product &&
                    product.name.toLowerCase().includes(productName);
            });

            if (matchingCard) {
                openProduct(getProductInfo(matchingCard));
            } else {
                speak("I could not find that product. Try searching for it first.");
            }

            return;
        }

        speak(
            'Sorry, I did not understand. Say "Help me" to hear the available commands.'
        );
    }

    // MICROPHONE STARTED
    recognition.onstart = function() {
        isListening = true;

        if (wakeMode) {
            announce(
                assistantAwake
                    ? "Asili is listening. Speak your shopping command."
                    : 'Asili is listening. Say "Hello Asili" to begin.'
            );
        }
    };

    // RECEIVE VOICE COMMAND
    recognition.onresult = function(event) {
        for (let i = event.resultIndex; i < event.results.length; i++) {
            if (!event.results[i].isFinal) continue;

            const command = event.results[i][0].transcript.trim();

            if (command) {
                handleCommand(command);
            }
        }
    };

    // HANDLE MICROPHONE ERRORS
    recognition.onerror = function(event) {
        console.warn("Voice recognition error:", event.error);

        if (
            event.error === "not-allowed" ||
            event.error === "service-not-allowed"
        ) {
            stopListening();
            announce("Please allow microphone access in your browser before using voice shopping.");
            return;
        }

        if (event.error === "audio-capture") {
            stopListening();
            announce("No working microphone was detected. Please connect a microphone.");
        }
    };

    // AUTOMATICALLY RESUME LISTENING
    recognition.onend = function() {
        isListening = false;

        if (wakeMode && !isSpeaking) {
            setTimeout(startListening, 700);
        }
    };

    // START OR STOP HANDS-FREE SHOPPING
    voiceButton.addEventListener("click", function() {

        if (wakeMode) {
            stopListening();
            speak("Voice shopping has been switched off.");
            return;
        }

        if (!window.isSecureContext) {
            announce("Microphone access requires HTTPS or localhost.");
            return;
        }

        wakeMode = true;
        assistantAwake = false;
        lastProduct = null;

        voiceButton.textContent = "⏹️ Stop voice shopping";
        voiceButton.setAttribute("aria-pressed", "true");

        speak(
            'Hands-free shopping is enabled. Say "Hello Asili" when you are ready.'
        );
    });

});



/* =========================================
   13. EMOJI FEEDBACK WIDGET
   ========================================= */

document.addEventListener("DOMContentLoaded", function() {

    const feedbackIcon = document.getElementById("feedbackIcon");
    const feedbackPopup = document.getElementById("feedbackPopup");
    const feedbackForm = document.getElementById("feedbackForm");
    const feedbackText = document.getElementById("fbMessage");
    const feedbackMessage = document.getElementById("feedbackMessage");
    const emotionButtons = document.querySelectorAll(".emotion-btn");

    if (
        !feedbackIcon ||
        !feedbackPopup ||
        !feedbackForm ||
        !feedbackText
    ) return;

    const emotions = {
        happy: {
            emoji: "😊",
            comment: "I feel good about my shopping experience at Asili Finds."
        },
        hungry: {
            emoji: "😠",
            comment: "I feel bad about my shopping experience at Asili Finds. Please improve the service."
        },
        frustrated: {
            emoji: "😣",
            comment: "I am frustrated with my shopping experience at Asili Finds. Please help improve it."
        }
    };

    let selectedEmotion = "";

    feedbackIcon.addEventListener("mouseenter", function() {
        if (!selectedEmotion) feedbackIcon.textContent = "😠";
    });

    feedbackIcon.addEventListener("mouseleave", function() {
        if (!selectedEmotion) feedbackIcon.textContent = "😊";
    });

    feedbackIcon.addEventListener("click", function() {
        feedbackPopup.hidden = !feedbackPopup.hidden;

        if (!feedbackPopup.hidden) {
            feedbackIcon.textContent = "😊";
        }
    });

    emotionButtons.forEach(button => {
        button.addEventListener("click", function() {
            selectedEmotion = button.dataset.emotion;

            if (!emotions[selectedEmotion]) return;

            emotionButtons.forEach(item => {
                item.classList.remove("selected");
            });

            button.classList.add("selected");

            feedbackIcon.textContent = emotions[selectedEmotion].emoji;
            feedbackText.value = emotions[selectedEmotion].comment;

            if (feedbackMessage) {
                feedbackMessage.textContent =
                    "Your comment is ready. You can edit it before submitting.";
            }
        });
    });

    feedbackForm.addEventListener("submit", function(event) {
        event.preventDefault();

        if (!selectedEmotion) {
            if (feedbackMessage) {
                feedbackMessage.textContent =
                    "Please choose a face before submitting.";
            }

            return;
        }

        const comment = feedbackText.value.trim();

        if (!comment) {
            if (feedbackMessage) {
                feedbackMessage.textContent =
                    "Please enter your feedback.";
            }

            return;
        }

        const feedback = {
            emotion: selectedEmotion,
            emoji: emotions[selectedEmotion].emoji,
            comment: comment,
            date: new Date().toLocaleString()
        };

        try {
            const saved = JSON.parse(
                localStorage.getItem("asiliFeedback") || "[]"
            );

            if (!Array.isArray(saved)) {
                throw new Error("Invalid feedback data");
            }

            saved.push(feedback);

            localStorage.setItem(
                "asiliFeedback",
                JSON.stringify(saved)
            );

            if (feedbackMessage) {
                feedbackMessage.textContent =
                    "Thank you! Your feedback has been submitted.";
            }

            feedbackForm.reset();
            selectedEmotion = "";

            emotionButtons.forEach(button => {
                button.classList.remove("selected");
            });

            feedbackIcon.textContent = "😊";

        } catch (error) {
            console.error("Could not save feedback:", error);

            if (feedbackMessage) {
                feedbackMessage.textContent =
                    "Unable to save feedback. Please try again.";
            }
        }
    });
});


/* =========================================
   14. AUTOMATIC CATEGORY HERO CAROUSEL
   ========================================= */

(() => {

    const image = document.getElementById("heroProductImage");
    const title = document.getElementById("heroTitle");
    const description = document.getElementById("heroDescription");
    const eyebrow = document.getElementById("heroEyebrow");
    const button = document.getElementById("heroButton");
    const trust = document.getElementById("heroTrust");
    const imageCategory = document.getElementById("heroImageCategory");
    const imageCaption = document.getElementById("heroImageCaption");
    const dotsContainer = document.getElementById("heroDots");

    if (
        !image || !title || !description || !eyebrow ||
        !button || !trust || !imageCategory ||
        !imageCaption || !dotsContainer
    ) return;

    const slides = [
        {
            category: "Electronics",
            heading: "Discover Smarter<br><span>Everyday Gadgets.</span>",
            description: "Explore exciting electronics, useful gadgets and technology that makes everyday life easier.",
            image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1000&q=85",
            alt: "Premium headphones",
            caption: "Technology meets everyday life.",
            trust: "Discover your next favourite gadget.",
            link: "electronics.html"
        },
        {
            category: "Fashion",
            heading: "Express Yourself.<br><span>Wear Your Style.</span>",
            description: "Discover stylish accessories and fashion finds that bring personality to every look.",
            image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1000&q=85",
            alt: "Fashion shopping and clothing",
            caption: "Find your personal style.",
            trust: "Style for your everyday moments.",
            link: "fashion.html"
        },
        {
            category: "Home & Living",
            heading: "Make Yourself<br><span>Feel at Home.</span>",
            description: "Find practical home essentials and beautiful touches for a more comfortable living space.",
            image: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1000&q=85",
            alt: "Beautiful modern living room",
            caption: "Comfort starts at home.",
            trust: "Thoughtful finds for your home.",
            link: "furniture.html"
        },
        {
            category: "Kitchen",
            heading: "Make Cooking<br><span>More Enjoyable.</span>",
            description: "Discover useful kitchen tools and essentials for everyday cooking.",
            image: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=1000&q=85",
            alt: "Modern kitchen",
            caption: "Practical kitchen essentials.",
            trust: "Make every meal easier.",
            link: "kitchen.html"
        },
        {
            category: "Beauty",
            heading: "Your Beauty.<br><span>Your Confidence.</span>",
            description: "Explore beauty essentials and self-care favourites for your everyday routine.",
            image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=1000&q=85",
            alt: "Beauty and makeup products",
            caption: "Make time for yourself.",
            trust: "Everyday essentials for self-care.",
            link: "beauty.html"
        },
        {
            category: "Refurbished",
            heading: "Great Finds.<br><span>Smarter Choices.</span>",
            description: "Discover refurbished products that offer practical value and everyday usefulness.",
            image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=1000&q=85",
            alt: "Laptop computer",
            caption: "Find value in every purchase.",
            trust: "Explore smarter shopping choices.",
            link: "refurbished.html"
        }
    ];

    const dots = Array.from(
        dotsContainer.querySelectorAll("button")
    );

    let currentSlide = 0;
    let carouselTimer;

    const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
    );

    function showSlide(index) {
        currentSlide = (index + slides.length) % slides.length;

        const slide = slides[currentSlide];

        image.classList.add("changing");

        title.innerHTML = slide.heading;
        description.textContent = slide.description;
        eyebrow.textContent = "DISCOVER " + slide.category.toUpperCase();

        button.innerHTML =
            "Shop " + slide.category +
            ' <i class="fa-solid fa-arrow-right"></i>';

        button.href = slide.link;
        trust.textContent = slide.trust;
        imageCategory.textContent = slide.category.toUpperCase();
        imageCaption.textContent = slide.caption;

        dots.forEach((dot, i) => {
            dot.classList.toggle("active", i === currentSlide);

            dot.setAttribute(
                "aria-pressed",
                i === currentSlide ? "true" : "false"
            );
        });

        const newImage = new Image();

        newImage.onload = function() {
            image.src = slide.image;
            image.alt = slide.alt;
            image.classList.remove("changing");
        };

        newImage.onerror = function() {
            image.classList.remove("changing");
        };

        newImage.src = slide.image;
    }

    function startCarousel() {
        clearInterval(carouselTimer);

        if (!reducedMotion.matches) {
            carouselTimer = setInterval(() => {
                showSlide(currentSlide + 1);
            }, 5000);
        }
    }

    dots.forEach((dot, index) => {
        dot.addEventListener("click", function() {
            showSlide(index);
            startCarousel();
        });
    });

    const hero = document.querySelector(".hero-section");

    if (hero) {
        hero.addEventListener("mouseenter", () => {
            clearInterval(carouselTimer);
        });

        hero.addEventListener("mouseleave", startCarousel);

        hero.addEventListener("focusin", () => {
            clearInterval(carouselTimer);
        });

        hero.addEventListener("focusout", startCarousel);
    }

    reducedMotion.addEventListener?.("change", startCarousel);

    showSlide(0);
    startCarousel();

})();

/* =========================================
   13. ASILI FINDS CUSTOMER ACCOUNT
   ========================================= */

document.addEventListener("DOMContentLoaded", function() {

    const accountLink = document.getElementById("accountLink");
    const accountLabel = document.getElementById("accountLabel");

    let currentUser = null;

    try {
        currentUser = JSON.parse(
            localStorage.getItem("asiliFindsCurrentUser")
        );
    } catch (error) {
        console.error("Could not load customer session:", error);
    }

    if (!currentUser || !currentUser.fullname) {
        return;
    }

    // Change Account to the customer's name.
    if (accountLabel) {
        accountLabel.textContent = currentUser.fullname;
    }

    // Keep the user on the homepage when they are logged in.
    if (accountLink) {
        accountLink.href = "#";
        accountLink.setAttribute("aria-label", "Log out");

        accountLink.addEventListener("click", function(event) {
            event.preventDefault();

            const shouldLogout = confirm("Would you like to log out?");

            if (shouldLogout) {
                localStorage.removeItem("asiliFindsCurrentUser");
                window.location.href = "index.html";
            }
        });
    }

    // Display a welcome message on the homepage.
    const heroContent = document.querySelector(".hero-content");

    if (heroContent) {
        const welcome = document.createElement("p");

        welcome.className = "asili-welcome-message";
        welcome.textContent = "Welcome back, " + currentUser.fullname + "!";

        welcome.style.color = "#263D2B";
        welcome.style.fontWeight = "bold";
        welcome.style.fontSize = "18px";
        welcome.style.marginBottom = "15px";

        heroContent.prepend(welcome);
    }

});
