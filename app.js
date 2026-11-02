/* Gather – Event Management System
   Pure HTML/CSS/JS. Data is stored in the browser (localStorage). */

const ADMIN_PASSWORD = "admin123";   // demo only – change it, see README
const CATEGORIES = ["Workshop", "Concert", "Conference", "Meetup", "Sports", "Festival"];
const KEYS = { events: "gather_events", regs: "gather_regs", admin: "gather_admin" };

/* ---------- Storage helpers ---------- */
function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    return fallback;
  }
}
function save(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { toast("Could not save data"); }
}
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

/* ---------- State ---------- */
let events = load(KEYS.events, null);
let regs = load(KEYS.regs, []);
let isAdmin = load(KEYS.admin, false) === true;
let currentEventId = null; // event open in attendees dialog

if (!events) {
  const d = (n) => {
    const x = new Date(); x.setDate(x.getDate() + n);
    return x.toISOString().slice(0, 10);
  };
  events = [
    { id: uid(), title: "Web Development Bootcamp", category: "Workshop", date: d(6), time: "10:00", venue: "Tech Hub, Lahore Road", capacity: 40, price: 499, description: "A hands-on day of HTML, CSS and JavaScript. Bring your laptop." },
    { id: uid(), title: "Open Mic Night", category: "Concert", date: d(12), time: "19:30", venue: "The Blue Room Café", capacity: 80, price: 0, description: "Sing, play or just listen. Free entry for everyone." },
    { id: uid(), title: "Startup Founders Meetup", category: "Meetup", date: d(20), time: "17:00", venue: "Co-work Space, Sector 5", capacity: 30, price: 199, description: "Meet founders, share ideas and find co-founders." },
    { id: uid(), title: "City Marathon 5K", category: "Sports", date: d(-8), time: "06:30", venue: "Central Park", capacity: 200, price: 300, description: "Community 5K run. Results are published on the website." }
  ];
  save(KEYS.events, events);
}

/* ---------- Utilities ---------- */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

function esc(str) {
  return String(str ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
const money = (n) => (n > 0 ? "₹" + Number(n).toLocaleString("en-IN") : "Free");
const eventDate = (e) => new Date(e.date + "T" + (e.time || "00:00"));
const isPast = (e) => eventDate(e) < new Date();
const seatsTaken = (id) => regs.filter((r) => r.eventId === id).reduce((s, r) => s + r.seats, 0);

function toast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => t.classList.remove("show"), 2600);
}

function fillCategories(select, withAll) {
  select.innerHTML = (withAll ? '<option value="">All categories</option>' : "") +
    CATEGORIES.map((c) => `<option value="${c}">${c}</option>`).join("");
}

function downloadCSV(filename, rows) {
  const csv = rows.map((r) => r.map((c) => '"' + String(c).replace(/"/g, '""') + '"').join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

/* ---------- Render: events ---------- */
function renderEvents() {
  const q = $("#search").value.trim().toLowerCase();
  const cat = $("#categoryFilter").value;
  const sort = $("#sortBy").value;
  const showPast = $("#showPast").checked;

  let list = events.filter((e) =>
    (showPast || !isPast(e)) &&
    (!cat || e.category === cat) &&
    (!q || e.title.toLowerCase().includes(q) || e.venue.toLowerCase().includes(q))
  );

  list.sort((a, b) => {
    if (sort === "price-asc") return a.price - b.price;
    const diff = eventDate(a) - eventDate(b);
    return sort === "date-desc" ? -diff : diff;
  });

  $("#emptyState").hidden = list.length > 0;
  $("#eventGrid").innerHTML = list.map(cardHTML).join("");
}

function cardHTML(e) {
  const taken = seatsTaken(e.id);
  const left = Math.max(e.capacity - taken, 0);
  const past = isPast(e);
  const full = left === 0;
  const d = eventDate(e);
  const day = d.getDate();
  const month = d.toLocaleString("en-IN", { month: "short", year: "numeric" });
  const time = d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
  const pct = Math.min(100, Math.round((taken / e.capacity) * 100));

  let action;
  if (past) action = '<span class="tag past">Event ended</span>';
  else if (full) action = '<span class="tag sold">Sold out</span>';
  else action = `<button class="btn btn-primary btn-sm" data-act="register" data-id="${e.id}">Register</button>`;

  const admin = isAdmin ? `
    <div class="admin-actions">
      <button class="btn btn-ghost btn-sm" data-act="attendees" data-id="${e.id}">Attendees (${regs.filter((r) => r.eventId === e.id).length})</button>
      <button class="btn btn-ghost btn-sm" data-act="edit" data-id="${e.id}">Edit</button>
      <button class="btn btn-danger btn-sm" data-act="delete" data-id="${e.id}">Delete</button>
    </div>` : "";

  return `
  <article class="event ${past ? "is-past" : ""}">
    <div class="event-date"><strong>${day}</strong><span>${month} · ${time}</span></div>
    <div class="event-body">
      <span class="tag">${esc(e.category)}</span>
      <h3>${esc(e.title)}</h3>
      <div class="meta">${esc(e.venue)}</div>
      <p>${esc(e.description)}</p>
      <div class="seats ${full ? "full" : ""}" title="${taken} of ${e.capacity} seats booked"><i style="width:${pct}%"></i></div>
      <div class="meta">${full ? "No seats left" : left + " of " + e.capacity + " seats left"}</div>
    </div>
    <div class="event-foot"><span class="price">${money(e.price)}</span>${action}</div>
    ${admin}
  </article>`;
}

/* ---------- Render: dashboard ---------- */
function renderDashboard() {
  const upcoming = events.filter((e) => !isPast(e)).length;
  const seats = regs.reduce((s, r) => s + r.seats, 0);
  const revenue = regs.reduce((s, r) => {
    const ev = events.find((e) => e.id === r.eventId);
    return s + (ev ? ev.price * r.seats : 0);
  }, 0);

  $("#stats").innerHTML = [
    [events.length, "Total events"],
    [upcoming, "Upcoming events"],
    [regs.length, "Registrations"],
    [seats, "Seats booked"],
    ["₹" + revenue.toLocaleString("en-IN"), "Ticket revenue"]
  ].map(([n, l]) => `<div class="stat"><b>${n}</b><span>${l}</span></div>`).join("");

  const rows = [...regs].sort((a, b) => b.at - a.at);
  $("#noRegs").hidden = rows.length > 0;
  $("#regTable").innerHTML = rows.map((r) => {
    const ev = events.find((e) => e.id === r.eventId);
    return `<tr>
      <td>${esc(r.name)}</td><td>${esc(r.email)}</td><td>${esc(ev ? ev.title : "Deleted event")}</td>
      <td>${r.seats}</td><td>${new Date(r.at).toLocaleDateString("en-IN")}</td>
      <td><button class="btn btn-danger btn-sm" data-cancel="${r.id}">Cancel</button></td>
    </tr>`;
  }).join("");
}

/* ---------- Views & admin mode ---------- */
function showView(name) {
  $$(".view").forEach((v) => (v.hidden = v.id !== "view-" + name));
  $$(".tab").forEach((t) => t.classList.toggle("is-active", t.dataset.view === name));
  if (name === "dashboard") renderDashboard();
  else renderEvents();
}

function applyAdminState() {
  $$(".admin-only").forEach((el) => (el.hidden = !isAdmin));
  $("#adminToggle").textContent = isAdmin ? "Log out" : "Admin login";
  if (!isAdmin && !$("#view-dashboard").hidden) showView("events");
  else renderEvents();
}

/* ---------- Dialog helpers ---------- */
$$("dialog").forEach((dlg) => {
  dlg.addEventListener("click", (ev) => {
    if (ev.target === dlg || ev.target.hasAttribute("data-close")) dlg.close();
  });
});

function openEventForm(ev) {
  const f = $("#eventForm");
  f.reset();
  $("#eventDialogTitle").textContent = ev ? "Edit event" : "New event";
  f.id.value = ev ? ev.id : "";
  if (ev) {
    ["title", "category", "date", "time", "venue", "capacity", "price", "description"].forEach((k) => (f[k].value = ev[k]));
  } else {
    f.date.min = new Date().toISOString().slice(0, 10);
  }
  $("#eventDialog").showModal();
}

function openRegForm(ev) {
  const f = $("#regForm");
  f.reset();
  f.eventId.value = ev.id;
  const left = ev.capacity - seatsTaken(ev.id);
  f.seats.max = Math.min(10, left);
  $("#regTitle").textContent = "Register: " + ev.title;
  $("#regInfo").textContent = `${eventDate(ev).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })} · ${ev.venue} · ${left} seats left`;
  updateRegTotal();
  $("#regDialog").showModal();
}

function updateRegTotal() {
  const ev = events.find((e) => e.id === $("#regForm").eventId.value);
  if (!ev) return;
  const seats = Number($("#regForm").seats.value) || 1;
  $("#regTotal").textContent = ev.price > 0 ? `Total: ₹${(ev.price * seats).toLocaleString("en-IN")}` : "This event is free.";
}

function openAttendees(id) {
  currentEventId = id;
  const ev = events.find((e) => e.id === id);
  const list = regs.filter((r) => r.eventId === id);
  $("#attendeesTitle").textContent = "Attendees: " + ev.title;
  $("#attendeesList").innerHTML = list.length
    ? list.map((r) => `<div class="attendee"><div>${esc(r.name)}<small>${esc(r.email)} · ${esc(r.phone)}</small></div><div>${r.seats} seat${r.seats > 1 ? "s" : ""}</div></div>`).join("")
    : '<p class="muted">Nobody has registered yet.</p>';
  $("#attendeesDialog").showModal();
}

/* ---------- Event handlers ---------- */
["search", "categoryFilter", "sortBy", "showPast"].forEach((id) =>
  $("#" + id).addEventListener("input", renderEvents)
);

$$(".tab").forEach((t) => t.addEventListener("click", () => showView(t.dataset.view)));

$("#addEventBtn").addEventListener("click", () => openEventForm(null));

$("#eventGrid").addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-act]");
  if (!btn) return;
  const ev = events.find((x) => x.id === btn.dataset.id);
  if (!ev) return;

  if (btn.dataset.act === "register") openRegForm(ev);
  if (btn.dataset.act === "attendees") openAttendees(ev.id);
  if (btn.dataset.act === "edit") openEventForm(ev);
  if (btn.dataset.act === "delete" && confirm(`Delete "${ev.title}" and its registrations?`)) {
    events = events.filter((x) => x.id !== ev.id);
    regs = regs.filter((r) => r.eventId !== ev.id);
    save(KEYS.events, events); save(KEYS.regs, regs);
    renderEvents();
    toast("Event deleted");
  }
});

$("#eventForm").addEventListener("submit", (e) => {
  const f = e.target;
  const data = {
    title: f.title.value.trim(),
    category: f.category.value,
    date: f.date.value,
    time: f.time.value,
    venue: f.venue.value.trim(),
    capacity: Math.max(1, parseInt(f.capacity.value, 10)),
    price: Math.max(0, parseInt(f.price.value, 10) || 0),
    description: f.description.value.trim()
  };
  if (f.id.value) {
    const i = events.findIndex((x) => x.id === f.id.value);
    const taken = seatsTaken(f.id.value);
    if (data.capacity < taken) {
      e.preventDefault();
      toast(`Capacity cannot be below ${taken} (seats already booked)`);
      return;
    }
    events[i] = { ...events[i], ...data };
    toast("Event updated");
  } else {
    events.push({ id: uid(), ...data });
    toast("Event created");
  }
  save(KEYS.events, events);
  renderEvents();
});

$("#regForm").addEventListener("input", updateRegTotal);

$("#regForm").addEventListener("submit", (e) => {
  const f = e.target;
  const ev = events.find((x) => x.id === f.eventId.value);
  const seats = parseInt(f.seats.value, 10);
  const email = f.email.value.trim().toLowerCase();

  if (!ev || isPast(ev)) { e.preventDefault(); toast("This event is no longer open"); return; }
  if (seats > ev.capacity - seatsTaken(ev.id)) { e.preventDefault(); toast("Not enough seats left"); return; }
  if (regs.some((r) => r.eventId === ev.id && r.email === email)) {
    e.preventDefault();
    toast("This email is already registered for the event");
    return;
  }

  regs.push({ id: uid(), eventId: ev.id, name: f.name.value.trim(), email, phone: f.phone.value.trim(), seats, at: Date.now() });
  save(KEYS.regs, regs);
  renderEvents();
  toast("You are registered. See you there!");
});

$("#regTable").addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-cancel]");
  if (!btn || !confirm("Cancel this registration?")) return;
  regs = regs.filter((r) => r.id !== btn.dataset.cancel);
  save(KEYS.regs, regs);
  renderDashboard();
  toast("Registration cancelled");
});

function regRows(list) {
  return [["Name", "Email", "Phone", "Event", "Seats", "Registered on"],
    ...list.map((r) => {
      const ev = events.find((x) => x.id === r.eventId);
      return [r.name, r.email, r.phone, ev ? ev.title : "", r.seats, new Date(r.at).toLocaleString("en-IN")];
    })];
}
$("#exportAll").addEventListener("click", () => downloadCSV("all-registrations.csv", regRows(regs)));
$("#exportEvent").addEventListener("click", () =>
  downloadCSV("attendees.csv", regRows(regs.filter((r) => r.eventId === currentEventId)))
);

/* Admin login / logout */
$("#adminToggle").addEventListener("click", () => {
  if (isAdmin) {
    isAdmin = false; save(KEYS.admin, false);
    applyAdminState();
    toast("Logged out");
  } else {
    $("#loginForm").reset();
    $("#loginError").hidden = true;
    $("#loginDialog").showModal();
  }
});

$("#loginForm").addEventListener("submit", (e) => {
  if (e.target.password.value === ADMIN_PASSWORD) {
    isAdmin = true; save(KEYS.admin, true);
    applyAdminState();
    toast("Logged in as admin");
  } else {
    e.preventDefault();
    $("#loginError").hidden = false;
  }
});

/* ---------- Init ---------- */
fillCategories($("#categoryFilter"), true);
fillCategories($("#eventForm").category, false);
applyAdminState();
