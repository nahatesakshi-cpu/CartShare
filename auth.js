(function () {
  const CartShareApp = window.CartShareApp || {};
  const { Utils } = CartShareApp;

  const AuthService = {
    getState() {
      return CartShareApp.App.state;
    },

    renderAuthMode(mode) {
      const loginWrap = document.getElementById('loginFormWrap');
      const registerWrap = document.getElementById('registerFormWrap');
      const buttons = document.querySelectorAll('.toggle-btn');

      const isLogin = mode === 'login';
      loginWrap.classList.toggle('d-none', !isLogin);
      registerWrap.classList.toggle('d-none', isLogin);
      buttons.forEach((button) => {
        button.classList.toggle('active', button.dataset.authMode === mode);
      });
    },

    login(email) {
      const state = this.getState();
      const normalizedEmail = String(email || '').trim().toLowerCase();
      const user = (state.users || []).find((entry) => entry.email.toLowerCase() === normalizedEmail);

      if (!user) {
        throw new Error('No account found for that email. Please register first.');
      }

      state.currentUserId = user.id;
      CartShareApp.Storage.saveState(state);
      CartShareApp.App.render();
      return user;
    },

    register(name, email) {
      const state = this.getState();
      const cleanName = String(name || '').trim();
      const cleanEmail = String(email || '').trim().toLowerCase();

      if (!cleanName || !cleanEmail) {
        throw new Error('Name and email are required.');
      }

      if ((state.users || []).some((user) => user.email.toLowerCase() === cleanEmail)) {
        throw new Error('A user with this email already exists.');
      }

      const newUser = {
        id: Utils.generateId('user'),
        name: cleanName,
        email: cleanEmail,
        createdAt: new Date().toISOString()
      };

      state.users.push(newUser);
      state.currentUserId = newUser.id;
      CartShareApp.Storage.saveState(state);
      CartShareApp.App.render();
      return newUser;
    },

    logout() {
      const state = this.getState();
      state.currentUserId = null;
      state.activeRoomId = null;
      CartShareApp.Storage.saveState(state);
      CartShareApp.App.render();
    },

    renderUserProfile() {
      const user = Utils.getCurrentUser(this.getState());
      const badge = document.getElementById('sidebarUserBadge');
      const name = document.getElementById('sidebarUserName');
      const email = document.getElementById('sidebarUserEmail');

      if (!user) {
        if (badge) badge.textContent = 'U';
        if (name) name.textContent = 'User';
        if (email) email.textContent = 'user@example.com';
        return;
      }

      if (badge) badge.textContent = Utils.getInitials(user.name);
      if (name) name.textContent = user.name;
      if (email) email.textContent = user.email;
    }
  };

  CartShareApp.Auth = AuthService;
  window.CartShareApp = CartShareApp;
})();
