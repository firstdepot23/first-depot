import { isValidObjectId, type Types } from "mongoose";
import { connectQuoteDB } from "./connection";
import { Todo, type TodoPlain } from "./todo-model";

/** What the UI gets: plain, serialisable, no Mongo types. */
export type TodoView = {
  id: string;
  title: string;
  date: string;
  done: boolean;
};

type TodoDoc = TodoPlain & { _id: Types.ObjectId };

const toView = (doc: TodoDoc): TodoView => ({
  id: String(doc._id),
  title: doc.title,
  date: doc.date,
  done: doc.done,
});

const DATE = /^\d{4}-\d{2}-\d{2}$/;

// Every query is scoped to the signed-in admin's userId, so one admin can
// never read or change another admin's tasks.

export const listTodos = async (userId: string, limit = 500): Promise<TodoView[]> => {
  await connectQuoteDB();
  const docs = await Todo.find({ userId })
    .sort({ date: -1, createdAt: 1 })
    .limit(limit)
    .lean<TodoDoc[]>();
  return docs.map(toView);
};

export const createTodo = async (
  userId: string,
  title: string,
  date: string,
): Promise<TodoView> => {
  const clean = title.trim();
  if (!clean) throw new Error("Please write the task first.");
  if (clean.length > 200) throw new Error("Please keep the task under 200 characters.");
  if (!DATE.test(date)) throw new Error("Invalid date.");

  await connectQuoteDB();
  const doc = await Todo.create({ userId, title: clean, date });
  return toView(doc.toObject() as TodoDoc);
};

export const setTodoDone = async (
  userId: string,
  id: string,
  done: boolean,
): Promise<TodoView | null> => {
  if (!isValidObjectId(id)) return null;
  await connectQuoteDB();
  const doc = await Todo.findOneAndUpdate({ _id: id, userId }, { done }, { new: true }).lean<TodoDoc>();
  return doc ? toView(doc) : null;
};

export const deleteTodo = async (userId: string, id: string): Promise<boolean> => {
  if (!isValidObjectId(id)) return false;
  await connectQuoteDB();
  const result = await Todo.deleteOne({ _id: id, userId });
  return result.deletedCount === 1;
};