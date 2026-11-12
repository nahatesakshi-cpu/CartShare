(function () {
  const CartShareApp = window.CartShareApp || {};
  const { Utils } = CartShareApp;

  const CartService = {
    getState() {
      return CartShareApp.App.state;
    },

    getCurrentRoom() {
      return Utils.getCurrentRoom(this.getState());
    },

    getFilteredProducts() {
      const room = this.getCurrentRoom();
      if (!room) {
        return [];
      }

      const searchValue = (document.getElementById('searchProductsInput')?.value || '').trim().toLowerCase();
      const categoryValue = document.getElementById('categoryFilterSelect')?.value || 'All';
      const sortValue = document.getElementById('sortProductsSelect')?.value || 'newest';
      const list = [...(room.cart || [])];

      const filtered = list.filter((item) => {
        const matchesSearch = !searchValue || item.name.toLowerCase().includes(searchValue);
        const matchesCategory = categoryValue === 'All' || item.category === categoryValue;
        return matchesSearch && matchesCategory;
      });

      filtered.sort((a, b) => {
        switch (sortValue) {
          case 'price-high':
            return Number(b.price) - Number(a.price);
          case 'price-low':
            return Number(a.price) - Number(b.price);
          case 'name-a-z':
            return String(a.name).localeCompare(String(b.name));
          case 'name-z-a':
            return String(b.name).localeCompare(String(a.name));
          case 'newest':
          default:
            return new Date(b.addedAt) - new Date(a.addedAt);
        }
      });

      return filtered;
    },

    addProduct(payload) {
      const state = this.getState();
      const room = this.getCurrentRoom();
      const user = Utils.getCurrentUser(state);

      if (!room || !user) {
        throw new Error('Create or join a room before adding products.');
      }

      const name = String(payload.name || '').trim();
      const category = String(payload.category || '').trim();
      const price = Number(payload.price);
      const quantity = Number(payload.quantity);
      const image = String(payload.image || '').trim();

      if (!name || !category || Number.isNaN(price) || price <= 0 || Number.isNaN(quantity) || quantity <= 0) {
        throw new Error('Please enter a valid product name, category, price, and quantity.');
      }

      const safeImage = image || `data:image/svg+xml;charset=utf-8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><rect width="800" height="600" fill="#eef2ff"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#4f46e5" font-size="42" font-family="Segoe UI">CartShare</text></svg>')}`;

      const product = {
        id: Utils.generateId('product'),
        name,
        category,
        price,
        quantity,
        image: safeImage,
        addedBy: user.id,
        addedByName: user.name,
        addedAt: new Date().toISOString()
      };

      room.cart.push(product);
      room.activities.unshift({
        id: Utils.generateId('activity'),
        type: 'product_added',
        userId: user.id,
        username: user.name,
        description: `${user.name} added ${name} to the cart.`,
        productName: name,
        createdAt: new Date().toISOString(),
        icon: 'bi-bag-check'
      });

      CartShareApp.Storage.saveState(state);
      return product;
    },

    updateQuantity(productId, change) {
      const room = this.getCurrentRoom();
      const user = Utils.getCurrentUser(this.getState());
      if (!room || !user) {
        throw new Error('No active room.');
      }

      const item = (room.cart || []).find((entry) => entry.id === productId);
      if (!item) {
        throw new Error('Product not found.');
      }

      const nextQuantity = Number(item.quantity) + Number(change);
      if (nextQuantity <= 0) {
        this.removeProduct(productId);
        return;
      }

      item.quantity = nextQuantity;
      room.activities.unshift({
        id: Utils.generateId('activity'),
        type: 'quantity_updated',
        userId: user.id,
        username: user.name,
        description: `${user.name} updated the quantity of ${item.name} to ${item.quantity}.`,
        productName: item.name,
        createdAt: new Date().toISOString(),
        icon: 'bi-pencil-square'
      });
      CartShareApp.Storage.saveState(this.getState());
    },

    removeProduct(productId) {
      const room = this.getCurrentRoom();
      const user = Utils.getCurrentUser(this.getState());
      if (!room || !user) {
        throw new Error('No active room.');
      }

      const product = (room.cart || []).find((entry) => entry.id === productId);
      if (!product) {
        throw new Error('Product not found.');
      }

      room.cart = (room.cart || []).filter((entry) => entry.id !== productId);
      room.activities.unshift({
        id: Utils.generateId('activity'),
        type: 'product_removed',
        userId: user.id,
        username: user.name,
        description: `${user.name} removed ${product.name} from the cart.`,
        productName: product.name,
        createdAt: new Date().toISOString(),
        icon: 'bi-trash'
      });
      CartShareApp.Storage.saveState(this.getState());
    },

    clearCart() {
      const room = this.getCurrentRoom();
      const user = Utils.getCurrentUser(this.getState());
      if (!room || !user) {
        throw new Error('No active room.');
      }

      if (!room.cart.length) {
        return;
      }

      room.activities.unshift({
        id: Utils.generateId('activity'),
        type: 'cart_cleared',
        userId: user.id,
        username: user.name,
        description: `${user.name} cleared the cart.`,
        productName: '',
        createdAt: new Date().toISOString(),
        icon: 'bi-cart-x'
      });
      room.cart = [];
      CartShareApp.Storage.saveState(this.getState());
    },

    render() {
      const room = this.getCurrentRoom();
      const cartList = document.getElementById('cartList');
      if (!cartList) {
        return;
      }

      if (!room) {
        cartList.innerHTML = '<div class="empty-state">Join a room to see and manage the cart.</div>';
        return;
      }

      const products = this.getFilteredProducts();
      if (!products.length) {
        cartList.innerHTML = '<div class="empty-state">No products match your current filters.</div>';
        return;
      }

      cartList.innerHTML = products.map((item) => `
        <div class="product-card">
          <img class="product-thumb" src="${Utils.escapeHtml(item.image || '')}" alt="${Utils.escapeHtml(item.name)}" />
          <div class="product-head">
            <div>
              <h4>${Utils.escapeHtml(item.name)}</h4>
              <span class="product-category">${Utils.escapeHtml(item.category)}</span>
            </div>
            <strong>${Utils.formatCurrency(Number(item.price) * Number(item.quantity))}</strong>
          </div>
          <div class="product-meta">
            <span>Added by: ${Utils.escapeHtml(item.addedByName || 'Unknown')}</span>
            <span>Added on: ${Utils.formatDateTime(item.addedAt)}</span>
            <span>Unit price: ${Utils.formatCurrency(item.price)}</span>
          </div>
          <div class="qty-controls">
            <button class="qty-btn" data-qty-action="decrease" data-product-id="${item.id}">−</button>
            <span class="qty-value">${item.quantity}</span>
            <button class="qty-btn" data-qty-action="increase" data-product-id="${item.id}">+</button>
          </div>
          <div class="product-actions">
            <button class="ghost-btn small-btn" data-remove-product="${item.id}">Remove</button>
          </div>
        </div>
      `).join('');
    }
  };

  CartShareApp.Cart = CartService;
  window.CartShareApp = CartShareApp;
})();
