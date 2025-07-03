const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  loadPage: (page) => ipcRenderer.send("load-page", page),
  saveEntry: (date, tasks, notes) => ipcRenderer.invoke("save-entry", date, tasks, notes),
  getEntries: () => ipcRenderer.invoke("get-entries"),
  deleteEntry: (id) => ipcRenderer.invoke("delete-entry", id),
  updateEntry: (id, tasks, notes) => ipcRenderer.invoke("update-entry", id, tasks, notes),
  getGroupedTasks: () => ipcRenderer.invoke("getGroupedTasks"),
  toggleTask: (taskId, completed) => ipcRenderer.invoke("toggle-task", taskId, completed)
});
