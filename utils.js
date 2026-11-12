(function () {
  const CartShareApp = window.CartShareApp || {};

  const Utils = {
    storageKey: 'CartShareDataV1',

    generateId(prefix = 'item') {
      return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2, 10)}`;
    },

    safeParse(value, fallback) {
      try {
        const parsed = JSON.parse(value);
        return parsed ?? fallback;
      } catch (error) {
        return fallback;
      }
    },

    defaultState() {
      return {
        currentUserId: null,
        activeRoomId: null,
        users: [],
        rooms: []
      };
    },

    formatCurrency(value) {
      const amount = Number(value) || 0;
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(amount);
    },

    formatDateTime(value) {
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) {
        return 'Unknown date';
      }

      return new Intl.DateTimeFormat('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short'
      }).format(date);
    },

    getInitials(name) {
      return String(name || 'U')
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0].toUpperCase())
        .join('') || 'U';
    },

    escapeHtml(value = '') {
      return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    },

    getRoomById(state, roomId) {
      return (state.rooms || []).find((room) => room.id === roomId) || null;
    },

    getCurrentUser(state) {
      return (state.users || []).find((user) => user.id === state.currentUserId) || null;
    },

    getCurrentRoom(state) {
      return Utils.getRoomById(state, state.activeRoomId);
    }
  };

  CartShareApp.Utils = Utils;
  window.CartShareApp = CartShareApp;
})();
