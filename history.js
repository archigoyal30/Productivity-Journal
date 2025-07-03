window.addEventListener("DOMContentLoaded", () => {
  const backBtn = document.getElementById("back-btn");
  const taskGrid = document.getElementById("task-grid");
  const searchBox = document.getElementById("search-box");

  const modal = document.getElementById("edit-modal");
  const modalList = document.getElementById("edit-task-list");
  const saveEditBtn = document.getElementById("save-edit-btn");
  const cancelEditBtn = document.getElementById("cancel-edit-btn");

  let currentEditId = null;

  backBtn.addEventListener("click", () => {
    window.electronAPI.loadPage("dashboard.html");
  });

  window.electronAPI.getEntries().then((grouped) => {
    renderGroupedTasks(grouped);

    searchBox.addEventListener("input", () => {
      const query = searchBox.value.toLowerCase();
      const filtered = {};
      Object.keys(grouped).forEach(id => {
        const entry = grouped[id];
        const matched = entry.tasks.filter(t => t.task.toLowerCase().includes(query));
        if (matched.length > 0) {
          filtered[id] = {
            ...entry,
            tasks: matched
          };
        }
      });
      renderGroupedTasks(filtered);
    });
  });

  function renderGroupedTasks(grouped) {
    taskGrid.innerHTML = "";
    Object.keys(grouped).forEach(id => {
      const entry = grouped[id];
      const card = document.createElement("div");
      card.className = "task-card";
      let tasksHtml = "";
      entry.tasks.forEach(taskObj => {
        tasksHtml += `
          <li>
            ${taskObj.task}
            <input type="checkbox" disabled ${taskObj.completed ? "checked" : ""} class="history-checkbox" />
          </li>
        `;
      });

      const notesHtml = entry.notes
        ? `<div class="entry-notes">Notes: ${entry.notes}</div>`
        : "";

      card.innerHTML = `
        <h4>${entry.date}</h4>
        <ul>${tasksHtml}</ul>
        ${notesHtml}
        <div class="card-buttons">
          <button class="edit-btn" data-id="${id}">Edit</button>
          <button class="delete-btn" data-id="${id}">Delete</button>
          <button class="add-btn">+</button>
        </div>
      `;
      taskGrid.appendChild(card);
    });

    document.querySelectorAll(".delete-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const id = e.target.getAttribute("data-id");
        if (confirm(`Delete this entry?`)) {
          window.electronAPI.deleteEntry(parseInt(id)).then(() => {
            window.location.reload();
          });
        }
      });
    });

    document.querySelectorAll(".edit-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        currentEditId = e.target.getAttribute("data-id");
        modal.classList.remove("hidden");
        populateModalTasks(grouped[currentEditId]);
      });
    });

    document.querySelectorAll(".add-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        window.electronAPI.loadPage("dashboard.html");
      });
    });
  }

  function populateModalTasks(entry) {
    modalList.innerHTML = "";
    entry.tasks.forEach(taskObj => {
      modalList.appendChild(makeEditTaskRow(taskObj.task, taskObj.completed));
    });
  }

  function makeEditTaskRow(taskText = "", completed = false) {
    const li = document.createElement("li");
    li.innerHTML = `
      <input type="text" value="${taskText}" class="edit-input" />
      <input type="checkbox" class="edit-complete-checkbox" ${completed ? "checked" : ""} />
      <button class="remove-row-btn">🗑️</button>
    `;
    li.querySelector(".remove-row-btn").addEventListener("click", () => {
      li.remove();
    });
    return li;
  }

  saveEditBtn.addEventListener("click", () => {
    const inputs = modalList.querySelectorAll(".edit-input");
    const checkboxes = modalList.querySelectorAll(".edit-complete-checkbox");

    const updatedTasks = [];
    inputs.forEach((input, idx) => {
      if (input.value.trim() !== "") {
        updatedTasks.push({
          text: input.value.trim(),
          completed: checkboxes[idx].checked
        });
      }
    });

    window.electronAPI.updateEntry(parseInt(currentEditId), updatedTasks, "").then(() => {
      window.location.reload();
    });
  });

  cancelEditBtn.addEventListener("click", () => {
    modal.classList.add("hidden");
    currentEditId = null;
  });

  // add dynamic add button inside modal
  const addRowBtn = document.createElement("button");
  addRowBtn.textContent = "+ Add Task";
  addRowBtn.classList.add("modal-add-btn");
  modalList.parentElement.appendChild(addRowBtn);

  addRowBtn.addEventListener("click", () => {
    modalList.appendChild(makeEditTaskRow());
  });
});
