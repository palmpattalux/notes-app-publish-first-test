const STORAGE_KEY = "my_notes_v1";

const $ = (id) => document.getElementById(id);

function loadNotes() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? [];
  } catch {
    return [];
  }
}

function saveNotes(notes) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

function uid() {
  return crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random();
}

function formatTime(iso) {
  const d = new Date(iso);
  return d.toLocaleString();
}

let notes = loadNotes();

function getFilteredNotes() {
  const q = $("search").value.trim().toLowerCase();
  const cat = $("filter").value;

  return notes
    .filter(n => !cat || n.category === cat)
    .filter(n => !q || (n.title + " " + n.content + " " + n.category).toLowerCase().includes(q))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function renderCategories() {
  const cats = Array.from(new Set(notes.map(n => n.category).filter(Boolean))).sort();
  const current = $("filter").value;

  $("filter").innerHTML = `<option value="">All categories</option>` + cats
    .map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`)
    .join("");

  // keep selection if possible
  if (cats.includes(current)) $("filter").value = current;
}

function render() {
  renderCategories();
  const items = getFilteredNotes();

  $("list").innerHTML = items.length
    ? items.map(noteCard).join("")
    : `<p class="meta">No notes yet.</p>`;
}

function addNote() {
  const title = $("title").value.trim();
  const category = $("category").value.trim();
  const content = $("content").value.trim();

  if (!content) return;

  const note = {
    id: uid(),
    title: title || "Untitled",
    category: category || "Uncategorized",
    content,
    createdAt: new Date().toISOString(),
  };

  notes.unshift(note);
  saveNotes(notes);

  $("title").value = "";
  $("category").value = "";
  $("content").value = "";
  $("content").focus();

  render();
}

function deleteNote(id) {
  notes = notes.filter(n => n.id !== id);
  saveNotes(notes);
  render();
}

function noteCard(n) {
  return `
    <div class="note">
      <div><strong>${escapeHtml(n.title)}</strong></div>
      <div class="meta">${escapeHtml(n.category)} • ${escapeHtml(formatTime(n.createdAt))}</div>
      <div style="margin-top:8px; white-space:pre-wrap;">${escapeHtml(n.content)}</div>
      <div class="actions">
        <button onclick="window.__del('${n.id}')">Delete</button>
      </div>
    </div>
  `;
}

// basic HTML escaping
function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// wire up events
$("addBtn").addEventListener("click", addNote);
$("content").addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === "Enter") addNote();
});
$("search").addEventListener("input", render);
$("filter").addEventListener("change", render);

// expose delete for inline button
window.__del = deleteNote;

render();
