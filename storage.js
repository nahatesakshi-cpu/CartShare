(function () {
  const CartShareApp = window.CartShareApp || {};
  const { Utils } = CartShareApp;

  const StorageService = {
    loadState() {
      try {
        const raw = localStorage.getItem(Utils.storageKey);
        const parsed = Utils.safeParse(raw, null);

        if (!parsed || !Array.isArray(parsed.rooms)) {
          return Utils.defaultState();
        }

        return {
          ...Utils.defaultState(),
          ...parsed,
          rooms: parsed.rooms.map((room) => ({
            ...room,
            participants: Array.isArray(room.participants) ? room.participants : [],
            cart: Array.isArray(room.cart) ? room.cart : [],
            activities: Array.isArray(room.activities) ? room.activities : []
          }))
        };
      } catch (error) {
        console.warn('Storage load failed, resetting to default state.', error);
        return Utils.defaultState();
      }
    },

    saveState(state) {
      try {
        localStorage.setItem(Utils.storageKey, JSON.stringify(state));
        window.dispatchEvent(new CustomEvent('cartshare-sync', { detail: state }));
      } catch (error) {
        console.error('Storage save failed', error);
        throw error;
      }
    },

    updateState(mutator) {
      const state = StorageService.loadState();
      const nextState = mutator(state) || state;
      StorageService.saveState(nextState);
      return nextState;
    }
  };

  CartShareApp.Storage = StorageService;
  window.CartShareApp = CartShareApp;
})();
