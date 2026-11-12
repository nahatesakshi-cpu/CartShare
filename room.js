(function () {
  const CartShareApp = window.CartShareApp || {};
  const { Utils } = CartShareApp;

  const RoomService = {
    getState() {
      return CartShareApp.App.state;
    },

    getCurrentRoom() {
      return Utils.getCurrentRoom(this.getState());
    },

    generateRoomCode() {
      const existing = (this.getState().rooms || []).map((room) => room.code);
      let code = '';
      do {
        code = Array.from({ length: 6 }, () => Math.floor(Math.random() * 36).toString(36).toUpperCase()).join('');
      } while (existing.includes(code));
      return code;
    },

    createRoom(roomName) {
      const state = this.getState();
      const user = Utils.getCurrentUser(state);
      const cleanName = String(roomName || '').trim();

      if (!user) {
        throw new Error('You must be logged in to create a room.');
      }

      if (!cleanName) {
        throw new Error('Room name is required.');
      }

      const room = {
        id: Utils.generateId('room'),
        name: cleanName,
        code: this.generateRoomCode(),
        creatorId: user.id,
        createdAt: new Date().toISOString(),
        minimumOrderAmount: 0,
        participants: [{
          id: user.id,
          name: user.name,
          email: user.email,
          joinedAt: new Date().toISOString()
        }],
        cart: [],
        activities: []
      };

      state.rooms.push(room);
      state.activeRoomId = room.id;

      const activity = {
        id: Utils.generateId('activity'),
        type: 'room_created',
        userId: user.id,
        username: user.name,
        description: `${user.name} created the room "${room.name}".`,
        productName: '',
        createdAt: new Date().toISOString(),
        icon: 'bi-door-open'
      };
      room.activities.unshift(activity);

      CartShareApp.Storage.saveState(state);
      return room;
    },

    joinRoom(code) {
      const state = this.getState();
      const user = Utils.getCurrentUser(state);
      const cleanCode = String(code || '').trim().toUpperCase();

      if (!user) {
        throw new Error('You must be logged in to join a room.');
      }

      if (!cleanCode) {
        throw new Error('A room code is required.');
      }

      const room = (state.rooms || []).find((entry) => entry.code === cleanCode);
      if (!room) {
        throw new Error('Room not found. Please check the room code.');
      }

      const alreadyJoined = (room.participants || []).some((participant) => participant.id === user.id);
      if (alreadyJoined) {
        state.activeRoomId = room.id;
        CartShareApp.Storage.saveState(state);
        return room;
      }

      room.participants.push({
        id: user.id,
        name: user.name,
        email: user.email,
        joinedAt: new Date().toISOString()
      });

      const activity = {
        id: Utils.generateId('activity'),
        type: 'user_joined',
        userId: user.id,
        username: user.name,
        description: `${user.name} joined the room.`,
        productName: '',
        createdAt: new Date().toISOString(),
        icon: 'bi-person-plus'
      };
      room.activities.unshift(activity);
      state.activeRoomId = room.id;
      CartShareApp.Storage.saveState(state);
      return room;
    },

    leaveRoom() {
      const state = this.getState();
      const room = this.getCurrentRoom();
      const user = Utils.getCurrentUser(state);

      if (!room || !user) {
        return;
      }

      const remainingParticipants = (room.participants || []).filter((participant) => participant.id !== user.id);
      if (remainingParticipants.length === 0) {
        state.rooms = (state.rooms || []).filter((entry) => entry.id !== room.id);
      } else {
        room.participants = remainingParticipants;
        room.activities.unshift({
          id: Utils.generateId('activity'),
          type: 'user_left',
          userId: user.id,
          username: user.name,
          description: `${user.name} left the room.`,
          productName: '',
          createdAt: new Date().toISOString(),
          icon: 'bi-box-arrow-left'
        });
      }

      state.activeRoomId = null;
      CartShareApp.Storage.saveState(state);
    },

    copyRoomCode() {
      const room = this.getCurrentRoom();
      if (!room) {
        throw new Error('You must select a room first.');
      }

      if (navigator.clipboard) {
        return navigator.clipboard.writeText(room.code)
          .then(() => room.code)
          .catch(() => room.code);
      }

      return Promise.resolve(room.code);
    },

    setMinimumOrder(amount) {
      const room = this.getCurrentRoom();
      if (!room) {
        throw new Error('No active room.');
      }

      const value = Number(amount) || 0;
      room.minimumOrderAmount = Math.max(0, value);
      CartShareApp.Storage.saveState(this.getState());
      return room.minimumOrderAmount;
    },

    render() {
      const room = this.getCurrentRoom();
      const roomDetails = document.getElementById('roomDetails');

      if (!roomDetails) {
        return;
      }

      if (!room) {
        roomDetails.innerHTML = `
          <div class="empty-state">
            <h4>No room selected yet</h4>
            <p>Create a room or join one using a room code to begin shopping together.</p>
          </div>
        `;
        return;
      }

      const participantMarkup = (room.participants || []).map((participant) => `
        <div class="participant-card">
          <div class="participant-meta">
            <div class="participant-avatar">${Utils.getInitials(participant.name)}</div>
            <div>
              <strong>${Utils.escapeHtml(participant.name)}</strong>
              <div class="muted">${Utils.escapeHtml(participant.email)}</div>
            </div>
          </div>
          <span class="badge">${participant.id === room.creatorId ? 'Creator' : 'Member'}</span>
        </div>
      `).join('');

      const cartTotal = (room.cart || []).reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0);
      const participantCount = (room.participants || []).length;
      const totalItems = (room.cart || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0);

      const thresholdRemaining = Math.max(room.minimumOrderAmount - cartTotal, 0);
      const progressWidth = room.minimumOrderAmount > 0 ? Math.min((cartTotal / room.minimumOrderAmount) * 100, 100) : 0;
      const thresholdState = room.minimumOrderAmount > 0 ? (cartTotal >= room.minimumOrderAmount ? 'Threshold reached' : `${Utils.formatCurrency(thresholdRemaining)} left to reach your goal`) : 'No minimum set';

      roomDetails.innerHTML = `
        <div class="room-header">
          <div>
            <p class="eyebrow">Active room</p>
            <h3>${Utils.escapeHtml(room.name)}</h3>
          </div>
          <div class="room-code-box">
            <span>Room code: <strong>${Utils.escapeHtml(room.code)}</strong></span>
            <button class="ghost-btn small-btn" data-copy-room="true">Copy</button>
          </div>
        </div>

        <div class="room-grid">
          <div class="room-stat">
            <p class="muted">Total items</p>
            <strong>${totalItems}</strong>
          </div>
          <div class="room-stat">
            <p class="muted">Cart total</p>
            <strong>${Utils.formatCurrency(cartTotal)}</strong>
          </div>
          <div class="room-stat">
            <p class="muted">Participants</p>
            <strong>${participantCount}</strong>
          </div>
          <div class="room-stat">
            <p class="muted">Minimum order</p>
            <strong>${Utils.formatCurrency(room.minimumOrderAmount || 0)}</strong>
          </div>
        </div>

        <div class="panel-card">
          <div class="panel-header">
            <h3>Delivery threshold tracker</h3>
          </div>
          <div class="field-group">
            <label for="minimumOrderInput">Set minimum order amount</label>
            <input id="minimumOrderInput" type="number" min="0" step="1" value="${room.minimumOrderAmount || 0}" />
          </div>
          <div class="inline-actions" style="margin-top: 12px;">
            <button id="saveThresholdBtn" class="primary-btn">Save threshold</button>
            <button id="leaveRoomBtn" class="danger-btn">Leave room</button>
          </div>
          <div class="summary-box" style="margin-top: 16px;">
            <div class="category-label">
              <span>Progress</span>
              <strong>${Math.round(progressWidth)}%</strong>
            </div>
            <div class="progress-bar" style="margin-top:8px; margin-bottom:8px;">
              <span style="width: ${progressWidth}%"></span>
            </div>
            <div class="muted">${thresholdState}</div>
          </div>
        </div>

        <div class="panel-card">
          <div class="panel-header">
            <h3>Participants</h3>
          </div>
          <div class="participant-list">
            ${participantMarkup || '<div class="empty-state">No participants yet.</div>'}
          </div>
        </div>
      `;

      const input = document.getElementById('minimumOrderInput');
      if (input) {
        input.addEventListener('keydown', (event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            const button = document.getElementById('saveThresholdBtn');
            if (button) button.click();
          }
        });
      }

      const saveButton = document.getElementById('saveThresholdBtn');
      if (saveButton) {
        saveButton.addEventListener('click', () => {
          const value = document.getElementById('minimumOrderInput')?.value || 0;
          try {
            RoomService.setMinimumOrder(value);
            CartShareApp.App.showToast('Minimum order updated successfully.');
            CartShareApp.App.render();
          } catch (error) {
            CartShareApp.App.showToast(error.message || 'Unable to update threshold.');
          }
        });
      }

      const leaveButton = document.getElementById('leaveRoomBtn');
      if (leaveButton) {
        leaveButton.addEventListener('click', () => {
          RoomService.leaveRoom();
          CartShareApp.App.render();
        });
      }

      const copyButton = document.querySelector('[data-copy-room]');
      if (copyButton) {
        copyButton.addEventListener('click', async () => {
          try {
            await RoomService.copyRoomCode();
            CartShareApp.App.showToast('Room code copied to clipboard.');
          } catch (error) {
            CartShareApp.App.showToast('Copy failed. Use the room code manually.');
          }
        });
      }
    }
  };

  CartShareApp.Room = RoomService;
  window.CartShareApp = CartShareApp;
})();
