(function () {
  const CartShareApp = window.CartShareApp || {};
  const { Utils } = CartShareApp;

  const ReceiptService = {
    getState() {
      return CartShareApp.App.state;
    },

    generateReceiptMarkup() {
      const room = Utils.getCurrentRoom(this.getState());
      if (!room) {
        return '<div class="empty-state">Create or join a room to generate a receipt.</div>';
      }

      const list = room.cart || [];
      const total = list.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0);
      const receiptId = `RC-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;

      const rows = list.length
        ? list.map((item) => `
            <tr>
              <td>${Utils.escapeHtml(item.name)}</td>
              <td>${Utils.escapeHtml(item.addedByName || 'Unknown')}</td>
              <td>${item.quantity}</td>
              <td>${Utils.formatCurrency(item.price)}</td>
              <td>${Utils.formatCurrency(Number(item.price) * Number(item.quantity))}</td>
            </tr>
          `).join('')
        : '<tr><td colspan="5">No products in the room cart.</td></tr>';

      const participantSummary = (room.participants || []).map((participant) => `
        <li>${Utils.escapeHtml(participant.name)} — ${Utils.formatCurrency((room.cart || []).filter((item) => item.addedBy === participant.id).reduce((sum, item) => sum + Number(item.price) * Number(item.quantity), 0))}</li>
      `).join('');

      return `
        <div class="print-receipt receipt-box">
          <div class="receipt-head">
            <div class="receipt-brand">
              <div class="brand-mark">C</div>
              <div>
                <h2>CartShare</h2>
                <small>Collaborative shopping receipt</small>
              </div>
            </div>
            <div>
              <strong>Receipt ID: ${Utils.escapeHtml(receiptId)}</strong>
              <div>${Utils.formatDateTime(new Date().toISOString())}</div>
            </div>
          </div>

          <div class="row g-3">
            <div class="col-md-6">
              <p><strong>Room:</strong> ${Utils.escapeHtml(room.name)}</p>
              <p><strong>Room code:</strong> ${Utils.escapeHtml(room.code)}</p>
            </div>
            <div class="col-md-6">
              <p><strong>Participants:</strong> ${(room.participants || []).map((participant) => participant.name).join(', ') || 'N/A'}</p>
            </div>
          </div>

          <table class="receipt-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Contributor</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="4">Grand total</td>
                <td>${Utils.formatCurrency(total)}</td>
              </tr>
            </tfoot>
          </table>

          <div style="margin-top: 24px;">
            <h4>Expense split</h4>
            <ul>
              ${participantSummary || '<li>No participant contributions yet.</li>'}
            </ul>
          </div>
        </div>
      `;
    },

    renderPreview() {
      const receiptPreview = document.getElementById('receiptPreview');
      if (!receiptPreview) {
        return;
      }
      receiptPreview.innerHTML = this.generateReceiptMarkup();
    },

    printReceipt() {
      const preview = document.getElementById('receiptPreview');
      if (!preview) {
        return;
      }

      const printedHtml = this.generateReceiptMarkup();
      const printWindow = window.open('', '_blank', 'width=900,height=700');
      if (!printWindow) {
        CartShareApp.App.showToast('Pop-up blocked. Please allow pop-ups to print the receipt.');
        return;
      }

      printWindow.document.write(`<!DOCTYPE html>
        <html>
          <head>
            <title>CartShare Receipt</title>
            <style>
              body { font-family: Segoe UI, sans-serif; padding: 24px; color: #111827; }
              table { width: 100%; border-collapse: collapse; margin-top: 18px; }
              th, td { border-bottom: 1px solid #e5e7eb; padding: 10px 8px; text-align: left; }
              h2, h4, p { margin: 0 0 10px; }
              .receipt-head { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #e5e7eb; padding-bottom: 16px; margin-bottom: 16px; }
              .brand-mark { width: 42px; height: 42px; border-radius: 12px; background: #eef2ff; display: inline-grid; place-items: center; font-size: 1.2rem; font-weight: 700; }
              .receipt-brand { display: flex; align-items: center; gap: 12px; }
            </style>
          </head>
          <body>
            ${printedHtml}
          </body>
        </html>`);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => printWindow.print(), 250);
    }
  };

  CartShareApp.Receipt = ReceiptService;
  window.CartShareApp = CartShareApp;
})();
