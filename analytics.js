(function () {
  const CartShareApp = window.CartShareApp || {};
  const { Utils } = CartShareApp;

  const AnalyticsService = {
    getState() {
      return CartShareApp.App.state;
    },

    summary() {
      const state = this.getState();
      const user = Utils.getCurrentUser(state);
      const room = Utils.getCurrentRoom(state);

      const rooms = state.rooms || [];
      const totalRoomsCreated = rooms.filter((entry) => entry.creatorId === user?.id).length;
      const totalProductsAdded = room ? (room.cart || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0) : 0;
      const totalCartValue = room ? (room.cart || []).reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0) : 0;
      const participantCount = room ? (room.participants || []).length : 0;

      return {
        totalRoomsCreated,
        totalProductsAdded,
        totalCartValue,
        participantCount,
        room,
        categories: room ? (room.cart || []).reduce((accumulator, item) => {
          accumulator[item.category] = (accumulator[item.category] || 0) + Number(item.quantity || 0);
          return accumulator;
        }, {}) : {},
        expenseByParticipant: room ? (room.participants || []).map((participant) => {
          const value = (room.cart || []).filter((item) => item.addedBy === participant.id).reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0);
          return { name: participant.name, value };
        }) : []
      };
    },

    render() {
      const summary = this.summary();
      const roomsCreated = document.getElementById('roomsCreatedStat');
      const productsAdded = document.getElementById('productsAddedStat');
      const cartValue = document.getElementById('cartValueStat');
      const participantCount = document.getElementById('participantsStat');
      const categorySummary = document.getElementById('categorySummary');
      const expenseSummary = document.getElementById('expenseSummary');

      if (roomsCreated) roomsCreated.textContent = String(summary.totalRoomsCreated || 0);
      if (productsAdded) productsAdded.textContent = String(summary.totalProductsAdded || 0);
      if (cartValue) cartValue.textContent = Utils.formatCurrency(summary.totalCartValue || 0);
      if (participantCount) participantCount.textContent = String(summary.participantCount || 0);

      if (categorySummary) {
        if (!summary.room || Object.keys(summary.categories || {}).length === 0) {
          categorySummary.innerHTML = '<div class="empty-state">No category activity recorded yet.</div>';
        } else {
          const maxValue = Math.max(...Object.values(summary.categories || {}), 1);
          categorySummary.innerHTML = Object.entries(summary.categories).map(([label, value]) => `
            <div class="category-row">
              <div class="category-label">
                <span>${Utils.escapeHtml(label)}</span>
                <strong>${value}</strong>
              </div>
              <div class="progress-bar">
                <span style="width: ${(value / maxValue) * 100}%"></span>
              </div>
            </div>
          `).join('');
        }
      }

      if (expenseSummary) {
        const total = summary.totalCartValue || 0;
        const participants = summary.expenseByParticipant || [];
        if (!participants.length) {
          expenseSummary.innerHTML = '<div class="empty-state">No expense data yet.</div>';
        } else {
          const equalSplit = total > 0 && participants.length ? total / participants.length : 0;
          expenseSummary.innerHTML = `
            <div class="summary-box">
              <h4>Equal split</h4>
              <strong>${Utils.formatCurrency(equalSplit)}</strong>
            </div>
            <div class="summary-box">
              <h4>Contribution split</h4>
              <div>
                ${participants.map((entry) => `
                  <div class="category-label" style="margin-bottom: 8px;">
                    <span>${Utils.escapeHtml(entry.name)}</span>
                    <strong>${Utils.formatCurrency(entry.value)}</strong>
                  </div>
                `).join('')}
              </div>
            </div>
          `;
        }
      }
    }
  };

  CartShareApp.Analytics = AnalyticsService;
  window.CartShareApp = CartShareApp;
})();
