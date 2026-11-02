# Gather – Event Management System

A simple event management web app built with plain **HTML, CSS and JavaScript**. No installation or backend needed. Data is saved in the browser using `localStorage`.

## Features

**For visitors**
- Browse upcoming events (past events can be shown with a checkbox)
- Search by title or venue, filter by category, sort by date or price
- Register for an event (name, email, phone, number of seats)
- Live seat counter, "Sold out" and "Event ended" states
- Duplicate registration and over-booking protection

**For admins**
- Login (demo password: `admin123`)
- Create, edit and delete events
- View attendees of each event
- Dashboard: total events, registrations, seats booked, ticket revenue
- Cancel registrations
- Export registrations to CSV

## Run locally

Open `index.html` in your browser. That is all.

## Deploy on GitHub Pages

1. Push this folder to a GitHub repository
2. Repo **Settings → Pages**
3. Source: **Deploy from a branch**, branch `main`, folder `/ (root)`
4. Your site will be live at `https://<username>.github.io/<repo-name>/`

## Project structure

```
event-management-system/
├── index.html
├── css/style.css
├── js/app.js
└── README.md
```

## Important notes

- The admin password is stored in `js/app.js`, so it is only for demo purposes. Real security needs a backend.
- Data stays in each visitor's own browser. It is not shared between users.

## Ideas to extend

- Backend with Node.js + Express + MongoDB (real login with JWT)
- Email confirmation after registration
- QR-code tickets
- Payment gateway (Razorpay / Stripe)
- Event images and a calendar view

## License

MIT
