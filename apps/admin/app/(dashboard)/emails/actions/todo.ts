"use server";

import { createTodo, deleteTodo, setTodoDone, type TodoView } from "@repo/quote-db";
import { requireAdmin } from "../../../lib/requireAdmin";

export type TodoResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; message: string };

const fail = (error: unknown, fallback: string): { ok: false; message: string } => {
  console.error(fallback, error);
  // Validation messages from createTodo are safe to show; anything else is not.
  const message =
    error instanceof Error && error.message.startsWith("Please")
      ? error.message
      : fallback;
  return { ok: false, message };
};

export const addTodoAction = async (
  title: string,
  date: string,
): Promise<TodoResult<TodoView>> => {
  const userId = await requireAdmin();
  try {
    return { ok: true, data: await createTodo(userId, title, date) };
  } catch (error) {
    return fail(error, "Couldn't add the task. Please try again.");
  }
};

export const toggleTodoAction = async (
  id: string,
  done: boolean,
): Promise<TodoResult<TodoView>> => {
  const userId = await requireAdmin();
  try {
    const todo = await setTodoDone(userId, id, done);
    return todo
      ? { ok: true, data: todo }
      : { ok: false, message: "This task no longer exists." };
  } catch (error) {
    return fail(error, "Couldn't update the task. Please try again.");
  }
};

export const removeTodoAction = async (id: string): Promise<TodoResult> => {
  const userId = await requireAdmin();
  try {
    const removed = await deleteTodo(userId, id);
    return removed
      ? { ok: true, data: undefined }
      : { ok: false, message: "This task no longer exists." };
  } catch (error) {
    return fail(error, "Couldn't delete the task. Please try again.");
  }
};