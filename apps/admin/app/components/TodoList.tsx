// Server part of the Todo List: loads this admin's tasks from the database and
// hands them to the interactive list. (Replaces the old TodoList.jsx, which
// showed made-up tasks. Delete that file.)
import { auth } from "@clerk/nextjs/server";
import { listTodos, type TodoView } from "@repo/quote-db";
import TodoListClient from "./TodoListClient";

// Today in Uganda as "YYYY-MM-DD" ("en-CA" prints dates in that order).
const todayInUganda = () =>
  new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Kampala" });

const TodoList = async () => {
  const { userId } = await auth();

  let todos: TodoView[] = [];
  let loadFailed = false;

  if (userId) {
    try {
      todos = await listTodos(userId);
    } catch (error) {
      console.error("Todo list could not be loaded:", error);
      loadFailed = true;
    }
  }

  return (
    <div className="">
      <h1 className="text-lg font-medium mb-6">Todo List</h1>
      <TodoListClient
        initial={todos}
        todayKey={todayInUganda()}
        loadFailed={loadFailed}
      />
    </div>
  );
};

export default TodoList;
