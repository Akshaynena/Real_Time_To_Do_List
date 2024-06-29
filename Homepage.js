
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const input = document.querySelector("input");
const addButton = document.querySelector(".add-button");
const todosHtml = document.querySelector(".todos");
const emptyImage = document.querySelector(".empty-image");
const deleteAllButton = document.querySelector(".delete-all");
const filters = document.querySelectorAll(".filter");
let filter = '';
let todosJson = [];
let userId = null;

const firebaseConfig = {
  apiKey: "AIzaSyCDRsUH3DXIf7BOrfjAghwV2Dn4kGAoB8o",
  authDomain: "todolist-odoo.firebaseapp.com",
  projectId: "todolist-odoo",
  storageBucket: "todolist-odoo.appspot.com",
  messagingSenderId: "481983280771",
  appId: "1:481983280771:web:f364e090b595da5c378db6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth();
const db = getFirestore(app);

onAuthStateChanged(auth, async (user) => {
  if (user) {
    userId = user.uid;
    await loadTodos();
  } else {
    window.location.href = 'login.html';
  }
});

async function loadTodos() {
  try {
    todosJson = [];
    const querySnapshot = await getDocs(collection(db, "users", userId, "todos"));
    querySnapshot.forEach((doc) => {
      todosJson.push({ id: doc.id, ...doc.data() });
    });
    showTodos();
  } catch (error) {
    console.error("Error loading todos:", error);
  }
}

function getTodoHtml(todo, index) {
  if (filter && filter !== todo.status) {
    return '';
  }
  let checked = todo.status === "completed" ? "checked" : "";
  return /* html */ `
    <li class="todo" data-id="${todo.id}">
      <label for="${index}">
        <input id="${index}" onclick="updateStatus(this)" type="checkbox" ${checked}>
        <span class="${checked}">${todo.name}</span>
      </label>
      <button class="delete-btn" data-index="${index}" onclick="remove(this)"><i class="fa fa-times"></i></button>
    </li>
  `;
}

function showTodos() {
  if (todosJson.length === 0) {
    todosHtml.innerHTML = '';
    emptyImage.style.display = 'block';
  } else {
    todosHtml.innerHTML = todosJson.map(getTodoHtml).join('');
    emptyImage.style.display = 'none';
  }
}

async function addTodo() {
  let todo = input.value.trim();
  if (!todo) {
    return;
  }
  input.value = "";
  try {
    const docRef = await addDoc(collection(db, "users", userId, "todos"), {
      name: todo,
      status: "pending"
    });
    todosJson.unshift({ id: docRef.id, name: todo, status: "pending" });
    showTodos();
  } catch (error) {
    console.error("Error adding todo:", error);
  }
}

input.addEventListener("keyup", (e) => {
  if (e.key === "Enter") {
    addTodo();
  }
});

addButton.addEventListener("click", addTodo);

window.updateStatus = async function (todo) {
  const todoElement = todo.closest('.todo');
  const todoId = todoElement.dataset.id;
  const todoIndex = todosJson.findIndex(t => t.id === todoId);
  let todoName = todo.parentElement.lastElementChild;
  todosJson[todoIndex].status = todo.checked ? "completed" : "pending";
  if (todo.checked) {
    todoName.classList.add("checked");
  } else {
    todoName.classList.remove("checked");
  }
  try {
    await updateDoc(doc(db, "users", userId, "todos", todoId), {
      status: todosJson[todoIndex].status
    });
    showTodos();
  } catch (error) {
    console.error("Error updating status:", error);
  }
};

window.remove = async function (todo) {
  const todoElement = todo.closest('.todo');
  const todoId = todoElement.dataset.id;
  const index = todosJson.findIndex(t => t.id === todoId);
  try {
    await deleteDoc(doc(db, "users", userId, "todos", todoId));
    todosJson.splice(index, 1);
    showTodos();
  } catch (error) {
    console.error("Error deleting todo:", error);
  }
};

filters.forEach(function (el) {
  el.addEventListener("click", (e) => {
    if (el.classList.contains('active')) {
      el.classList.remove('active');
      filter = '';
    } else {
      filters.forEach(tag => tag.classList.remove('active'));
      el.classList.add('active');
      filter = e.target.dataset.filter;
    }
    showTodos();
  });
});

deleteAllButton.addEventListener("click", async () => {
  try {
    const batch = db.batch();
    todosJson.forEach(todo => {
      const todoRef = doc(db, "users", userId, "todos", todo.id);
      batch.delete(todoRef);
    });
    await batch.commit();
    todosJson = [];
    showTodos();
  } catch (error) {
    console.error("Error deleting all todos:", error);
  }
});

const logoutButton = document.getElementById('logout');
logoutButton.addEventListener('click', () => {
  signOut(auth)
    .then(() => {
      window.location.href = 'index.html';
    })
    .catch((error) => {
      console.error('Error Signing out:', error);
    });
});
