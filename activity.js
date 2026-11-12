(function () {
  const CartShareApp = window.CartShareApp || {};
  const { Utils } = CartShareApp;

  const ActivityService = {
    getState() {
      return CartShareApp.App.state;
    },

    addActivity(room, payload) {
      if (!room) {
        return null;
      }

      const activity = {
        id: Utils.generateId('activity'),
        type: payload.type,
        userId: payload.userId,
        username: payload.username,
        description: payload.description,
        productName: payload.productName || '',
        createdAt: payload.createdAt || new Date().toISOString(),
        icon: payload.icon || 'bi-broadcast'
      };

      room.activities = Array.isArray(room.activities) ? room.activities : [];
      room.activities.unshift(activity);
      return activity;
    },

    render() {
      const room = Utils.getCurrentRoom(this.getState());
      const activityList = document.getElementById('activityList');
      const recentActivityList = document.getElementById('recentActivityList');

      const activities = room ? (room.activities || []).slice(0, 8) : [];
      const markup = activities.length
        ? activities.map((activity) => `
            <div class="activity-item">
              <div class="activity-icon"><i class="bi ${Utils.escapeHtml(activity.icon || 'bi-broadcast')}"></i></div>
              <div>
                <strong>${Utils.escapeHtml(activity.username || 'System')}</strong>
                <div>${Utils.escapeHtml(activity.description || 'Activity update')}</div>
                <small>${Utils.formatDateTime(activity.createdAt)}</small>
              </div>
            </div>
          `).join('')
        : '<div class="empty-state">No recent activity yet.</div>';

      if (activityList) {
        activityList.innerHTML = markup;
      }

      if (recentActivityList) {
        recentActivityList.innerHTML = markup;
      }
    }
  };

  CartShareApp.Activity = ActivityService;
  window.CartShareApp = CartShareApp;
})();
