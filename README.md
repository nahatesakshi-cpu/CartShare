# CartShare

CartShare is a collaborative shopping ecosystem for students, roommates, shared households, and small groups. It helps people create rooms, manage a shared cart, track activities, split expenses, and print a receipt for group purchases.

## Features

- Simulated authentication for registered users
- Create and join shopping rooms with room codes
- Shared cart management with product add, edit, quantity update, and delete
- Real-time cross-tab synchronization using browser storage events
- Activity logs for room updates and cart changes
- Delivery threshold tracking with progress bar and success state
- Expense splitting for equal and contribution-based calculations
- Product search, category filtering, and sorting
- Printable and audit-friendly shopping receipt
- Responsive dashboard for desktop, tablet, and mobile screens

## Tech stack

- HTML5
- CSS3
- Bootstrap 5
- Vanilla JavaScript (ES6+)
- LocalStorage for persistence
- JavaScript Storage Events for same-origin tab sync

## Project structure

```text
CartShare/
├── index.html
├── README.md
├── css/
│   ├── style.css
│   └── responsive.css
├── js/
│   ├── app.js
│   ├── auth.js
│   ├── room.js
│   ├── cart.js
│   ├── activity.js
│   ├── storage.js
│   ├── receipt.js
│   ├── analytics.js
│   └── utils.js
├── assets/
│   ├── images/
│   └── icons/
└── .gitignore
```

## Run locally

1. Open the project folder in VS Code.
2. Start a simple static file server from the project root:

```bash
cd "C:/Users/SAKSHI/OneDrive/Desktop/CartShare"
python -m http.server 8000
```

3. Open `http://localhost:8000` in your browser.

## How to test features

1. Register a user or log in.
2. Create a new room and copy the room code.
3. Open another tab and join with the same room code.
4. Add products from different tabs and confirm the cart updates.
5. Change product quantity and remove items.
6. Confirm the activity log updates correctly.
7. Set a delivery threshold and observe the progress bar.
8. Review equal and contribution-based expense estimates.
9. Generate and print the receipt.
10. Refresh the page and verify local persistence.

## Deployment

This app is ready for static hosting on Netlify, Vercel, or GitHub Pages.

### Netlify

- Push the project to a GitHub repository.
- Import the repo into Netlify.
- Set the publish directory to the project root.
- Deploy.

### Vercel

- Import the repo in Vercel.
- Use the project root as the app directory.
- Deploy without any build step for this static app.

### GitHub Pages

- Enable GitHub Pages in the repo settings.
- Point the site to the root folder or a docs folder if needed.

## Known limitation

This frontend-only version uses LocalStorage for demo synchronization and is not a production-grade multi-user backend. It is designed to be ready for a future backend and real-time websocket integration.

## Submission naming

Use the naming format:

`BatchID_FullName_CartShare`
