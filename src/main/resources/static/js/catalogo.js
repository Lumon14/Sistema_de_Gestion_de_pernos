// ===== VARIABLES GLOBALES =====
let productsData = [];
let currentProducts = [];
let cart = [];
let currentView = 'grid';
let currentSortBy = 'name-asc';

// ===== HELPER CSRF (no depende de main.js) =====
function getCsrfHeaders() {
    const token = document.querySelector("meta[name='_csrf']")?.getAttribute("content");
    const header = document.querySelector("meta[name='_csrf_header']")?.getAttribute("content");
    const headers = {};
    if (token && header) {
        headers[header] = token;
    }
    return headers;
}

// ===== INICIALIZACIÓN =====
document.addEventListener('DOMContentLoaded', () => {
    loadCategoriesFromAPI();
    loadProductsFromAPI();
    loadCart();
    setupEventListeners();
});

// ===== CARGAR PRODUCTOS DE LA API =====
async function loadProductsFromAPI() {
    try {
        const response = await fetch('/productos/api/listar');
        if (!response.ok) throw new Error('Error al cargar productos');

        const result = await response.json();
        productsData = result.data.map(p => ({
            ...p,
            precio: p.precioVenta,
            precioOriginal: p.precioVenta,
            categoria: p.categoria ? p.categoria.nombre : 'Sin categoría',
            proveedor: p.proveedor ? p.proveedor.nombre : 'Sin proveedor',
            imagen: p.imagen || '/images/products/placeholder.jpg'
        }));
        currentProducts = [...productsData];
        renderProducts(currentProducts);
    } catch (error) {
        console.error('Error:', error);
        showToast('Error al cargar los productos');
    }
}

// ===== CARGAR CATEGORÍAS DE LA API =====
async function loadCategoriesFromAPI() {
    try {
        const response = await fetch('/categorias/api/listar');
        if (!response.ok) throw new Error('Error al cargar categorías');

        const result = await response.json();
        const categories = result.data;
        renderCategories(categories);
    } catch (error) {
        console.error('Error:', error);
    }
}

function renderCategories(categories) {
    const container = document.getElementById('dynamicCategories');
    container.innerHTML = '';

    categories.forEach(cat => {
        const div = document.createElement('div');
        div.className = 'form-check';
        div.innerHTML = `
            <input class="form-check-input category-filter" type="checkbox" value="${cat.nombre}" id="cat${cat.id}">
            <label class="form-check-label" for="cat${cat.id}">${cat.nombre}</label>
        `;
        container.appendChild(div);
    });

    // Re-vincular eventos para los nuevos checkboxes
    document.querySelectorAll('.category-filter').forEach(checkbox => {
        checkbox.addEventListener('change', applyFilters);
    });
}
// ===== EVENT LISTENERS =====
function setupEventListeners() {
    // Filtros
    document.querySelectorAll('.toggle-filter').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const targetId = e.target.dataset.target;
            const content = document.getElementById(targetId);
            content.classList.toggle('collapsed');
            e.target.textContent = content.classList.contains('collapsed') ? '+' : '−';
        });
    });

    // Filtro Disponibilidad
    document.querySelectorAll('.availability-filter').forEach(checkbox => {
        checkbox.addEventListener('change', applyFilters);
    });

    // Filtro Categoría
    document.querySelectorAll('.category-filter').forEach(checkbox => {
        checkbox.addEventListener('change', applyFilters);
    });

    // Filtro Precio
    const priceRange = document.getElementById('priceRange');
    if (priceRange) {
        priceRange.addEventListener('input', (e) => {
            document.getElementById('priceValue').textContent = e.target.value;
            applyFilters();
        });
    }

    // Ordenamiento
    const sortBy = document.getElementById('sortBy');
    if (sortBy) {
        sortBy.addEventListener('change', (e) => {
            currentSortBy = e.target.value;
            sortProducts();
            renderProducts(currentProducts);
        });
    }

    // Vista Grid/Lista
    const gridView = document.getElementById('gridView');
    if (gridView) {
        gridView.addEventListener('click', () => {
            currentView = 'grid';
            document.getElementById('gridView').classList.add('active');
            document.getElementById('listView').classList.remove('active');
            renderProducts(currentProducts);
        });
    }

    const listView = document.getElementById('listView');
    if (listView) {
        listView.addEventListener('click', () => {
            currentView = 'list';
            document.getElementById('listView').classList.add('active');
            document.getElementById('gridView').classList.remove('active');
            renderProducts(currentProducts);
        });
    }

    // Abrir Modal de Carrito
    const cartToggleBtn = document.getElementById('cartToggleBtn');
    if (cartToggleBtn) {
        cartToggleBtn.addEventListener('click', (e) => {
            e.preventDefault();
            showCartModal();
        });
    }

    // Navegación en Carrito (Paso 1 a Paso 2)
    const btnGoToStep2 = document.getElementById('btnGoToStep2');
    if (btnGoToStep2) {
        btnGoToStep2.addEventListener('click', () => {
            if (cart.length === 0) {
                showToast('El carrito está vacío');
                return;
            }
            document.getElementById('cartStep1').classList.add('d-none');
            document.getElementById('cartStep2').classList.remove('d-none');
        });
    }

    // Navegación en Carrito (Paso 2 a Paso 1)
    const btnBackToStep1 = document.getElementById('btnBackToStep1');
    if (btnBackToStep1) {
        btnBackToStep1.addEventListener('click', () => {
            document.getElementById('cartStep2').classList.add('d-none');
            document.getElementById('cartStep1').classList.remove('d-none');
        });
    }

    // Confirmar Pedido (Paso 2)
    const btnConfirmOrder = document.getElementById('btnConfirmOrder');
    if (btnConfirmOrder) {
        btnConfirmOrder.addEventListener('click', submitOrder);
    }
}

// ===== FILTROS =====
function applyFilters() {
    const availabilityFilters = Array.from(document.querySelectorAll('.availability-filter:checked'))
        .map(cb => cb.value);

    const categoryFilters = Array.from(document.querySelectorAll('.category-filter:checked'))
        .map(cb => cb.value);

    const maxPrice = parseInt(document.getElementById('priceRange').value);

    currentProducts = productsData.filter(product => {
        // Filtro de disponibilidad
        if (availabilityFilters.length > 0) {
            const isAvailable = product.stock > 0;
            const matchesAvailability = availabilityFilters.some(filter => {
                return (filter === 'true' && isAvailable) || (filter === 'false' && !isAvailable);
            });
            if (!matchesAvailability) return false;
        }

        // Filtro de categoría
        if (!categoryFilters.includes('all') && categoryFilters.length > 0) {
            if (!categoryFilters.some(filter => filter.toLowerCase() === product.categoria.toLowerCase())) return false;
        }

        // Filtro de precio
        if (product.precio > maxPrice) return false;

        return true;
    });

    sortProducts();
    renderProducts(currentProducts);
}

// ===== ORDENAMIENTO =====
function sortProducts() {
    switch (currentSortBy) {
        case 'name-asc':
            currentProducts.sort((a, b) => a.nombre.localeCompare(b.nombre));
            break;
        case 'name-desc':
            currentProducts.sort((a, b) => b.nombre.localeCompare(a.nombre));
            break;
        case 'price-asc':
            currentProducts.sort((a, b) => a.precio - b.precio);
            break;
        case 'price-desc':
            currentProducts.sort((a, b) => b.precio - a.precio);
            break;
    }
}

// ===== RENDERIZAR PRODUCTOS =====
function renderProducts(products) {
    const container = document.getElementById('productsGrid');
    container.innerHTML = '';

    products.forEach(product => {
        const discount = Math.round(((product.precioOriginal - product.precio) / product.precioOriginal) * 100);
        const isOutOfStock = product.stock === 0;

        const card = document.createElement('div');
        card.className = `product-card ${currentView === 'list' ? 'list-view-item' : ''}`;

        card.innerHTML = `
            <div class="product-image-wrapper">
                <img src="${product.imagen}" alt="${product.nombre}" class="product-image">
                <span class="discount-badge">Ahorro ${discount}%</span>
                <div class="product-actions-overlay">
                    <button class="action-btn view-btn" onclick="viewProduct(${product.id})" title="Ver detalle">
                        <i class="bi bi-eye"></i>
                    </button>
                    <button class="action-btn cart-btn ${isOutOfStock ? 'disabled' : ''}" 
                            onclick="quickAddToCart(${product.id})" 
                            ${isOutOfStock ? 'disabled' : ''} 
                            title="Agregar al carrito">
                        <i class="bi bi-cart-plus"></i>
                    </button>
                </div>
            </div>
            <div class="product-info">
                <div>
                    <p class="product-category">${product.categoria}</p>
                    <h5 class="product-name">${product.nombre}</h5>
                    <p class="product-provider">${product.proveedor}</p>
                    <div class="product-stock">
                        <span class="${isOutOfStock ? 'stock-unavailable' : 'stock-available'}">
                            ${isOutOfStock ? 'Agotado' : `${product.stock} en stock`}
                        </span>
                    </div>
                </div>
                <div class="product-price">
                    <span class="original-price">S/. ${product.precioOriginal.toFixed(2)}</span>
                    <h3 class="current-price">S/. ${product.precio.toFixed(2)}</h3>
                </div>
            </div>
        `;

        container.appendChild(card);
    });
}

// ===== MODAL DETALLE =====
function viewProduct(productId) {
    const product = productsData.find(p => p.id === productId);
    if (!product) return;

    const discount = Math.round(((product.precioOriginal - product.precio) / product.precioOriginal) * 100);

    document.getElementById('modalImage').src = product.imagen;
    document.getElementById('modalTitle').textContent = product.nombre;
    document.getElementById('modalProvider').textContent = `por ${product.proveedor}`;
    document.getElementById('modalDescription').textContent = product.descripcion;
    document.getElementById('modalStock').textContent = product.stock > 0 ? `${product.stock} en stock` : 'Agotado';
    document.getElementById('modalOriginalPrice').textContent = `S/. ${product.precioOriginal.toFixed(2)}`;
    document.getElementById('modalPrice').textContent = `S/. ${product.precio.toFixed(2)}`;
    document.getElementById('modalQuantity').value = 1;
    document.getElementById('modalQuantity').max = product.stock;

    // Botones cantidad
    document.getElementById('decreaseQty').onclick = () => {
        const qty = parseInt(document.getElementById('modalQuantity').value);
        if (qty > 1) document.getElementById('modalQuantity').value = qty - 1;
    };

    document.getElementById('increaseQty').onclick = () => {
        const qty = parseInt(document.getElementById('modalQuantity').value);
        if (qty < product.stock) document.getElementById('modalQuantity').value = qty + 1;
    };

    // Botón agregar al carrito
    document.getElementById('addToCartBtn').onclick = () => {
        addToCart(productId, parseInt(document.getElementById('modalQuantity').value));
        const modal = bootstrap.Modal.getInstance(document.getElementById('productModal'));
        modal.hide();
    };

    const modal = new bootstrap.Modal(document.getElementById('productModal'));
    modal.show();
}

// ===== CARRITO =====
function addToCart(productId, quantity) {
    const product = productsData.find(p => p.id === productId);
    if (!product || quantity <= 0) return;

    // Controlar stock
    const existingItem = cart.find(item => item.id === productId);
    const newQty = (existingItem ? existingItem.quantity : 0) + quantity;

    if (newQty > product.stock) {
        showToast(`Stock insuficiente. Máximo disponible: ${product.stock}`);
        return;
    }

    if (existingItem) {
        existingItem.quantity = newQty;
    } else {
        cart.push({
            id: productId,
            nombre: product.nombre,
            precio: product.precio,
            imagen: product.imagen,
            quantity: quantity
        });
    }

    saveCart();
    updateCartBadge();
    showToast(`${product.nombre} agregado al carrito`);
}

function quickAddToCart(productId) {
    addToCart(productId, 1);
}

// ===== ALMACENAMIENTO LOCAL =====
function saveCart() {
    localStorage.setItem('pernos_vega_cart', JSON.stringify(cart));
}

function loadCart() {
    const saved = localStorage.getItem('pernos_vega_cart');
    cart = saved ? JSON.parse(saved) : [];
    updateCartBadge();
}

// ===== ACTUALIZAR BADGE =====
function updateCartBadge() {
    const badge = document.getElementById('cartBadgeCount');
    if (!badge) return;
    
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    if (totalItems > 0) {
        badge.textContent = totalItems;
        badge.style.display = 'inline-block';
    } else {
        badge.style.display = 'none';
    }
}

// ===== MOSTRAR MODAL DE CARRITO =====
function showCartModal() {
    // Resetear al paso 1 por si acaso
    document.getElementById('cartStep2').classList.add('d-none');
    document.getElementById('cartStep1').classList.remove('d-none');
    
    renderCartModal();
    
    const cartModal = new bootstrap.Modal(document.getElementById('cartModal'));
    cartModal.show();
}

// ===== RENDERIZAR CARRITO =====
function renderCartModal() {
    const container = document.getElementById('cartItemsList');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (cart.length === 0) {
        container.innerHTML = `
            <tr>
                <td colspan="5" class="text-center py-4 text-muted">
                    <i class="bi bi-cart-x fs-2 d-block mb-2"></i>
                    Tu carrito está vacío
                </td>
            </tr>
        `;
        document.getElementById('cartTotalAmount').textContent = 'S/. 0.00';
        return;
    }
    
    let total = 0;
    
    cart.forEach(item => {
        const subtotal = item.quantity * item.precio;
        total += subtotal;
        
        // Obtener stock máximo del producto para no exceder
        const product = productsData.find(p => p.id === item.id);
        const maxStock = product ? product.stock : 999;
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <div class="d-flex align-items-center gap-2">
                    <img src="${item.imagen || '/images/products/placeholder.jpg'}" alt="${item.nombre}" style="width: 50px; height: 50px; object-fit: cover;" class="rounded">
                    <div>
                        <h6 class="mb-0 fw-bold" style="font-size: 0.9rem;">${item.nombre}</h6>
                    </div>
                </div>
            </td>
            <td class="text-center">
                <div class="quantity-selector d-flex align-items-center justify-content-center" style="transform: scale(0.85);">
                    <button class="qty-btn" onclick="changeCartQty(${item.id}, -1)">−</button>
                    <input type="number" value="${item.quantity}" min="1" max="${maxStock}" class="qty-input text-center" style="width: 40px;" readonly>
                    <button class="qty-btn" onclick="changeCartQty(${item.id}, 1)">+</button>
                </div>
            </td>
            <td class="text-end" style="font-size: 0.9rem;">S/. ${item.precio.toFixed(2)}</td>
            <td class="text-end fw-bold" style="font-size: 0.9rem;">S/. ${subtotal.toFixed(2)}</td>
            <td class="text-center">
                <button type="button" class="btn btn-sm btn-link text-danger p-0" onclick="removeCartItem(${item.id})">
                    <i class="bi bi-trash fs-5"></i>
                </button>
            </td>
        `;
        container.appendChild(row);
    });
    
    document.getElementById('cartTotalAmount').textContent = `S/. ${total.toFixed(2)}`;
}

// ===== CAMBIAR CANTIDAD EN CARRITO =====
window.changeCartQty = function(productId, delta) {
    const item = cart.find(i => i.id === productId);
    if (!item) return;
    
    const product = productsData.find(p => p.id === productId);
    const maxStock = product ? product.stock : 999;
    
    const newQty = item.quantity + delta;
    if (newQty >= 1 && newQty <= maxStock) {
        item.quantity = newQty;
        saveCart();
        updateCartBadge();
        renderCartModal();
    } else if (newQty > maxStock) {
        showToast(`Stock insuficiente. Límite: ${maxStock} unidades.`);
    }
};

// ===== ELIMINAR ITEM =====
window.removeCartItem = function(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCart();
    updateCartBadge();
    renderCartModal();
};

// ===== CONFIRMAR PEDIDO (POST) =====
async function submitOrder(e) {
    if (e) e.preventDefault();

    const form = document.getElementById('formCheckout');
    if (!form.checkValidity()) {
        form.classList.add('was-validated');
        return;
    }

    const orderData = {
        cliente: {
            nombre: document.getElementById('clienteNombre').value.trim(),
            dniRuc: document.getElementById('clienteDniRuc').value.trim(),
            telefono: document.getElementById('clienteTelefono').value.trim(),
            email: document.getElementById('clienteEmail').value.trim()
        },
        detalles: cart.map(item => ({
            producto: { id: item.id },
            cantidad: item.quantity
        }))
    };

    try {
        const btn = document.getElementById('btnConfirmOrder');
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Registrando...';

        const response = await fetch('/pedidos/api/registrar', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...getCsrfHeaders()
            },
            body: JSON.stringify(orderData)
        });

        let result = null;
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
            result = await response.json();
        }

        if (response.ok && result && result.success) {
            cart = [];
            saveCart();
            updateCartBadge();

            // Cerrar modal
            const cartModalEl = document.getElementById('cartModal');
            const modal = bootstrap.Modal.getInstance(cartModalEl);
            if (modal) modal.hide();

            form.reset();
            form.classList.remove('was-validated');
            
            // Volver paso 1
            document.getElementById('cartStep2').classList.add('d-none');
            document.getElementById('cartStep1').classList.remove('d-none');

            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    title: '¡Pedido Registrado!',
                    text: 'Tu pedido ha sido enviado con éxito. Nos comunicaremos contigo para coordinar el pago y la entrega.',
                    icon: 'success',
                    confirmButtonText: 'Excelente',
                    confirmButtonColor: '#ffc107'
                });
            } else {
                alert('¡Pedido registrado correctamente! Nos comunicaremos contigo para coordinar el pago y la entrega.');
            }
        } else {
            const errMsg = result ? result.message : `Error de servidor HTTP ${response.status}`;
            showToast('Error: ' + errMsg);
            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    title: 'Error al procesar pedido',
                    text: errMsg,
                    icon: 'error',
                    confirmButtonText: 'Entendido'
                });
            }
        }
    } catch (error) {
        console.error('Error al registrar pedido:', error);
        showToast('Error al conectar con el servidor');
    } finally {
        const btn = document.getElementById('btnConfirmOrder');
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i class="bi bi-check2-circle"></i> Confirmar Pedido';
        }
    }
}

// ===== NOTIFICACIONES =====
function showToast(message) {
    const toastElement = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');

    if (toastMessage && toastElement) {
        toastMessage.textContent = message;
        const toast = new bootstrap.Toast(toastElement);
        toast.show();
    } else {
        console.log("Toast:", message);
    }
}