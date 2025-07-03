const weekday = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const month = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const displayWeekDay = document.getElementById("day");
const displayDayNb = document.getElementById("number");
const displayMonth = document.getElementById("month");

const today = new Date();
let todayName = today.getDay();
let todayNumber = today.getDate();
let todayMonth = today.getMonth();

displayWeekDay.innerHTML = weekday[todayName];
displayDayNb.innerHTML = todayNumber;
displayMonth.innerHTML = month[todayMonth];

const addTaskBtn = document.getElementById("add-btn");
const inputTask = document.getElementById("write-task");
let taskList = [];
const taskSpans = [];
const progressBarValue = document.getElementById("progress-bar");
let totalTasks = 0;

const finishBtn = document.getElementById("finish-btn");
const historyBtn = document.getElementById("history-btn");

for (let i = 1; i <= 7; i++) {
  let taskSpan = document.getElementById("text-task-" + i);
  if (taskSpan) {
    taskSpans.push(taskSpan);
    taskSpan.addEventListener("click", (event) => {
      event.target.classList.toggle("done");
      event.target.classList.toggle("checked");
      updateProgressBar();
    });
  }
}

addTaskBtn.addEventListener("click", () => {
  if (inputTask.value.trim() === "") {
    console.warn("Please enter a task before adding to the list.");
  } else if (taskList.length >= 7) {
    console.warn("Task list is full. You can only add up to 7 tasks.");
  } else {
    taskList.push(inputTask.value);
    updateTaskDisplay();
    inputTask.value = "";
    totalTasks++;
    updateProgressBar();
  }
});

finishBtn.addEventListener("click", () => {
  const dayString = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
  const notes = document.getElementById("notes-box").value;

  // store progress in local storage
  localStorage.setItem("finalProgress", progressBarValue.value);

  // collect task completion states
  const tasksWithStatus = [];
  for (let i = 0; i < taskList.length; i++) {
    const text = taskList[i];
    const isDone = taskSpans[i].classList.contains("checked") ? 1 : 0;
    tasksWithStatus.push({
      text: text,
      completed: isDone
    });
  }

  window.electronAPI.saveEntry(dayString, tasksWithStatus, notes);
  window.electronAPI.loadPage("finishDay.html");
});

historyBtn.addEventListener("click", () => {
  window.electronAPI.loadPage("history.html");
});

function updateTaskDisplay() {
  for (let i = 0; i < taskSpans.length; i++) {
    if (taskList[i]) {
      taskSpans[i].textContent = taskList[i];
    } else {
      taskSpans[i].textContent = "";
    }
  }
}

function updateProgressBar() {
  const checkedElements = document.querySelectorAll(".checked");
  const checkedCount = checkedElements.length;
  const totalTasks = taskList.length;
  const progress = totalTasks ? checkedCount / totalTasks : 0;
  progressBarValue.value = progress * 100;
}
