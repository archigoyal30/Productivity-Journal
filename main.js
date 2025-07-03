const path = require("path");
const { app, BrowserWindow, ipcMain } = require("electron");
const Database = require("better-sqlite3");

// ✅ FIX: use a writable database location
const dbPath = path.join(app.getPath("userData"), "tasks.db");
const db = new Database(dbPath);

// create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT,
    notes TEXT
  )
`);
db.exec(`
  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entry_id INTEGER,
    task TEXT,
    completed INTEGER,
    FOREIGN KEY(entry_id) REFERENCES entries(id)
  )
`);

let win;

// create main window
function createWindow() {
  win = new BrowserWindow({
    width: 600,
    height: 750,
    icon: path.join(__dirname, "assets", "icon.icns"),  // <-- added icon
    webPreferences: {
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
  });
  win.removeMenu();
  win.loadFile("index.html");

  ipcMain.on("load-page", (_, page) => {
    win.loadFile(page);
  });
}

// save a journal entry
ipcMain.handle("save-entry", (_, date, tasks, notes) => {
  const entryStmt = db.prepare(
    "INSERT INTO entries (date, notes) VALUES (?, ?)"
  );
  const info = entryStmt.run(date, notes);
  const entryId = info.lastInsertRowid;

  const taskStmt = db.prepare(
    "INSERT INTO tasks (entry_id, task, completed) VALUES (?, ?, ?)"
  );
  tasks.forEach((t) => {
    const text = typeof t === "string" ? t : t.text;
    const completed = typeof t === "object" && t.completed ? 1 : 0;
    taskStmt.run(entryId, text, completed);
  });
});

// get entries grouped by entry ID
ipcMain.handle("get-entries", () => {
  const entries = db.prepare("SELECT * FROM entries ORDER BY id DESC").all();
  const tasks = db.prepare("SELECT * FROM tasks").all();

  const grouped = {};
  entries.forEach((entry) => {
    grouped[entry.id] = {
      id: entry.id,
      date: entry.date,
      notes: entry.notes,
      tasks: tasks
        .filter((t) => t.entry_id === entry.id)
        .map((t) => ({
          id: t.id,
          task: t.task,
          completed: t.completed === 1,
        })),
    };
  });
  return grouped;
});

// delete an entry
ipcMain.handle("delete-entry", (_, id) => {
  db.prepare("DELETE FROM tasks WHERE entry_id = ?").run(id);
  db.prepare("DELETE FROM entries WHERE id = ?").run(id);
});

// update an entry
ipcMain.handle("update-entry", (_, entryId, tasks, notes) => {
  db.prepare("DELETE FROM tasks WHERE entry_id = ?").run(entryId);
  db.prepare("UPDATE entries SET notes = ? WHERE id = ?").run(notes, entryId);

  const taskStmt = db.prepare(
    "INSERT INTO tasks (entry_id, task, completed) VALUES (?, ?, ?)"
  );
  tasks.forEach((t) => {
    taskStmt.run(entryId, t.text, t.completed ? 1 : 0);
  });
});

// toggle a single task's completed status
ipcMain.handle("toggle-task", (_, taskId, completed) => {
  db.prepare("UPDATE tasks SET completed = ? WHERE id = ?").run(
    completed ? 1 : 0,
    taskId
  );
});

// get grouped tasks by date with correct booleans
ipcMain.handle("getGroupedTasks", () => {
  const entries = db.prepare("SELECT * FROM entries ORDER BY id DESC").all();
  const tasks = db.prepare("SELECT * FROM tasks").all();

  const grouped = {};
  entries.forEach((entry) => {
    const relevantTasks = tasks
      .filter((t) => t.entry_id === entry.id)
      .map((t) => ({
        id: t.id,
        task: t.task,
        completed: t.completed === 1,
      }));

    grouped[entry.date] = {
      notes: entry.notes,
      tasks: relevantTasks,
    };
  });
  return grouped;
});

// app ready
app.whenReady().then(() => {
  createWindow();
});
