(function () {
  const CartShareApp = window.CartShareApp || {};
  const { Utils, Storage, Auth, Room, Cart, Activity, Receipt, Analytics } = CartShareApp;

  const App = {
    state: Storage.loadState(),
    activeView: 'dashboard',

    init() {
      this.state = Storage.loadState();
      this.bindEvents();
      this.render();
    },

    bindEvents() {
      document.addEventListener('submit', (event) => {
        const target = event.target;

        if (target.id === 'loginForm') {
          event.preventDefault();
          const email = target.querySelector('#loginEmail')?.value || '';
          try {
            Auth.login(email);
            this.showToast('Welcome back!');
          } catch (error) {
            this.showToast(error.message || 'Unable to log in.');
          }
        }

        if (target.id === 'registerForm') {
          event.preventDefault();
          const name = target.querySelector('#registerName')?.value || '';
          const email = target.querySelector('#registerEmail')?.value || '';
          try {
            Auth.register(name, email);
            this.showToast('Account created successfully!');
          } catch (error) {
            this.showToast(error.message || 'Unable to create your account.');
          }
        }

        if (target.id === 'createRoomForm') {
          event.preventDefault();
          const roomName = target.querySelector('#roomName')?.value || '';
          try {
            Room.createRoom(roomName);
            this.showToast('Room created successfully!');
            this.render();
          } catch (error) {
            this.showToast(error.message || 'Unable to create the room.');
          }
        }

        if (target.id === 'joinRoomForm') {
          event.preventDefault();
          const roomCode = target.querySelector('#roomCodeInput')?.value || '';
          try {
            Room.joinRoom(roomCode);
            this.showToast('You joined the room successfully!');
            this.render();
          } catch (error) {
            this.showToast(error.message || 'Unable to join the room.');
          }
        }

        if (target.id === 'addProductForm') {
          event.preventDefault();
          try {
            Cart.addProduct({
              name: target.querySelector('#productName')?.value || '',
              category: target.querySelector('#productCategory')?.value || '',
              price: target.querySelector('#productPrice')?.value || 0,
              quantity: target.querySelector('#productQuantity')?.value || 1,
              image: target.querySelector('#productImage')?.value || ''
            });
            target.reset();
            target.querySelector('#productQuantity').value = 1;
            this.showToast('Product added to the cart.');
            this.render();
          } catch (error) {
            this.showToast(error.message || 'Unable to add product.');
          }
        }
      });

      document.addEventListener('click', (event) => {
        const navBtn = event.target.closest('[data-view]');
        if (navBtn) {
          this.activeView = navBtn.dataset.view;
          this.renderSections();
          return;
        }

        const authToggle = event.target.closest('[data-auth-mode]');
        if (authToggle) {
          Auth.renderAuthMode(authToggle.dataset.authMode);
          return;
        }

        const qtyButton = event.target.closest('[data-qty-action]');
        if (qtyButton) {
          const productId = qtyButton.dataset.productId;
          const direction = qtyButton.dataset.qtyAction;
          try {
            Cart.updateQuantity(productId, direction === 'increase' ? 1 : -1);
            this.render();
          } catch (error) {
            this.showToast(error.message || 'Unable to update quantity.');
          }
          return;
        }

        const removeButton = event.target.closest('[data-remove-product]');
        if (removeButton) {
          const { removeProduct } = Cart;
          try {
            removeProduct(removeButton.dataset.removeProduct);
            this.showToast('Product removed from the cart.');
            this.render();
          } catch (error) {
            this.showToast(error.message || 'Unable to remove product.');
          }
          return;
        }

        const clearCartBtn = event.target.closest('#clearCartBtn');
        if (clearCartBtn) {
          const confirmed = window.confirm('Clear all products from the current cart?');
          if (confirmed) {
            try {
              Cart.clearCart();
              this.showToast('Cart cleared.');
              this.render();
            } catch (error) {
              this.showToast(error.message || 'Unable to clear cart.');
            }
          }
          return;
        }

        const generateReceiptBtn = event.target.closest('#generateReceiptBtn');
        if (generateReceiptBtn) {
          this.render();
          this.showToast('Receipt generated.');
          return;
        }

        const printReceiptBtn = event.target.closest('#printReceiptBtn');
        if (printReceiptBtn) {
          try {
            Receipt.printReceipt();
          } catch (error) {
            this.showToast(error.message || 'Unable to print receipt.');
          }
          return;
        }

        const logoutBtn = event.target.closest('#logoutBtn');
        if (logoutBtn) {
          Auth.logout();
          return;
        }

        const clearFiltersBtn = event.target.closest('#clearFiltersBtn');
        if (clearFiltersBtn) {
          const input = document.getElementById('searchProductsInput');
          const filter = document.getElementById('categoryFilterSelect');
          const sort = document.getElementById('sortProductsSelect');
          if (input) input.value = '';
          if (filter) filter.value = 'All';
          if (sort) sort.value = 'newest';
          this.render();
          return;
        }
      });

      document.addEventListener('input', (event) => {
        const target = event.target;
        if (target.id === 'searchProductsInput' || target.id === 'categoryFilterSelect' || target.id === 'sortProductsSelect') {
          this.render();
        }
      });

      window.addEventListener('storage', (event) => {
        if (event.key === Utils.storageKey) {
          this.state = Storage.loadState();
          this.render();
        }
      });

      window.addEventListener('cartshare-sync', () => {
        this.state = Storage.loadState();
        this.render();
      });
    },

    renderSections() {
      const navButtons = document.querySelectorAll('.nav-link');
      navButtons.forEach((button) => {
        const current = button.dataset.view === this.activeView;
        button.classList.toggle('active', current);
      });

      const idMap = {
        dashboard: 'dashboardSection',
        room: 'roomSection',
        cart: 'cartSection',
        activity: 'activitySection',
        receipt: 'receiptSection'
      };

      const pageTitle = document.getElementById('pageTitle');
      const labels = {
        dashboard: 'Dashboard',
        room: 'Room Management',
        cart: 'Shared Cart',
        activity: 'Activity Log',
        receipt: 'Printable Receipt'
      };

      Object.entries(idMap).forEach(([key, sectionId]) => {
        const section = document.getElementById(sectionId);
        if (section) {
          section.classList.toggle('active', key === this.activeView);
        }
      });

      if (pageTitle) {
        pageTitle.textContent = labels[this.activeView] || 'Dashboard';
      }
    },

    render() {
      this.state = Storage.loadState();
      const user = Utils.getCurrentUser(this.state);
      const authScreen = document.getElementById('authScreen');
      const appShell = document.getElementById('appShell');

      if (!user) {
        if (authScreen) authScreen.classList.remove('d-none');
        if (appShell) appShell.classList.add('d-none');
        Auth.renderAuthMode('login');
        return;
      }

      if (authScreen) authScreen.classList.add('d-none');
      if (appShell) appShell.classList.remove('d-none');

      Auth.renderUserProfile();
      this.renderSections();
      Room.render();
      Cart.render();
      Activity.render();
      Receipt.renderPreview();
      Analytics.render();
    },

    showToast(message) {
      const container = document.getElementById('toastContainer');
      if (!container) {
        return;
      }

      const toast = document.createElement('div');
      toast.className = 'toast';
      toast.textContent = message;
      container.appendChild(toast);
      setTimeout(() => {
        toast.remove();
      }, 2200);
    }
  };

  CartShareApp.App = App;
  window.CartShareApp = CartShareApp;

  document.addEventListener('DOMContentLoaded', () => {
    App.init();
  });
})();
