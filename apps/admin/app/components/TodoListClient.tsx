"use client";

import { useMemo, useState } from "react";
import { format, parse } from "date-fns";
import { CalendarIcon, Plus, Trash2 } from "lucide-react";
import { toast } from "react-toastify";
import type { TodoView } from "@repo/quote-db";
import { Card } from "./ui/card";
import { Checkbox } from "./ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { ScrollArea } from "./ui/scroll-area";
import { Button } from "./ui/button";
import { Calendar } from "./ui/calendar";
import {
  addTodoAction,
  removeTodoAction,
  toggleTodoAction,
} from "../(dashboard)/emails/actions/todo";

type View = "day" | "overdue" | "all";

const keyOf = (date: Date) => format(date, "yyyy-MM-dd");
const fromKey = (key: string) => parse(key, "yyyy-MM-dd", new Date());

const TodoListClient = ({
  initial,
  todayKey,
  loadFailed,
}: {
  initial: TodoView[];
  /** Today's date in Uganda, from the server, so server and browser agree. */
  todayKey: string;
  loadFailed: boolean;
}) => {
  const [todos, setTodos] = useState<TodoView[]>(initial);
  const [date, setDate] = useState<Date>(() => fromKey(todayKey));
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>("day");
  const [title, setTitle] = useState("");
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState<ReadonlySet<string>>(new Set());

  const selectedKey = keyOf(date);

  const setBusyFor = (id: string, on: boolean) =>
    setBusy((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });

  const overdue = useMemo(
    () => todos.filter((t) => !t.done && t.date < todayKey),
    [todos, todayKey],
  );

  const visible = useMemo(() => {
    const list =
      view === "day"
        ? todos.filter((t) => t.date === selectedKey)
        : view === "overdue"
          ? overdue
          : todos;
    // Open tasks first, then by day, keeping the order they were added in.
    return [...list].sort(
      (a, b) => Number(a.done) - Number(b.done) || a.date.localeCompare(b.date),
    );
  }, [todos, view, selectedKey, overdue]);

  const doneCount = visible.filter((t) => t.done).length;

  const add = async (event: React.FormEvent) => {
    event.preventDefault();
    const text = title.trim();
    if (!text || adding) return;

    setAdding(true);
    const result = await addTodoAction(text, selectedKey);
    setAdding(false);

    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    setTodos((prev) => [result.data, ...prev]);
    setTitle("");
    setView("day"); // show the task that was just added
  };

  const toggle = async (todo: TodoView, done: boolean) => {
    if (busy.has(todo.id)) return;
    setBusyFor(todo.id, true);
    setTodos((prev) =>
      prev.map((t) => (t.id === todo.id ? { ...t, done } : t)),
    );

    const result = await toggleTodoAction(todo.id, done);
    setBusyFor(todo.id, false);

    if (!result.ok) {
      setTodos((prev) =>
        prev.map((t) => (t.id === todo.id ? { ...t, done: todo.done } : t)),
      );
      toast.error(result.message);
    }
  };

  const remove = async (todo: TodoView) => {
    if (busy.has(todo.id)) return;
    setBusyFor(todo.id, true);
    setTodos((prev) => prev.filter((t) => t.id !== todo.id));

    const result = await removeTodoAction(todo.id);
    setBusyFor(todo.id, false);

    if (!result.ok) {
      setTodos((prev) => [todo, ...prev]); // put it back
      toast.error(result.message);
    }
  };

  const tabs: [View, string][] = [
    ["day", "Day"],
    ["overdue", overdue.length ? `Overdue (${overdue.length})` : "Overdue"],
    ["all", "All"],
  ];

  return (
    <div>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button className="w-full">
            <CalendarIcon />
            {selectedKey === todayKey ? "Today · " : ""}
            {format(date, "PPP")}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-auto">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(picked) => {
              if (picked) {
                setDate(picked);
                setView("day");
              }
              setOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>

      {/* Add a task for the selected day */}
      <form onSubmit={add} className="mt-3 flex gap-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={200}
          placeholder="Add a task for this day"
          aria-label="New task"
          className="border-input bg-background h-9 min-w-0 flex-1 rounded-md border px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
        />
        <Button type="submit" size="icon" disabled={adding || !title.trim()}>
          <Plus />
          <span className="sr-only">Add task</span>
        </Button>
      </form>

      {/* Day / Overdue / All */}
      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="flex gap-1 rounded-md bg-muted p-1 text-xs">
          {tabs.map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setView(key)}
              className={`rounded px-2 py-1 ${
                view === key
                  ? "bg-background font-medium shadow-sm"
                  : "text-muted-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        {visible.length > 0 && (
          <span className="text-xs text-muted-foreground">
            {doneCount} of {visible.length} done
          </span>
        )}
      </div>

      {loadFailed && (
        <p className="mt-3 text-sm text-destructive">
          Your tasks could not be loaded. Refresh the page to try again.
        </p>
      )}

      {/* LIST */}
      <ScrollArea className="max-h-[400px] mt-4 overflow-y-auto">
        <div className="flex flex-col gap-4">
          {visible.length === 0 && !loadFailed && (
            <p className="text-sm text-muted-foreground">
              {view === "day"
                ? "No tasks for this day yet."
                : view === "overdue"
                  ? "Nothing overdue. Well done!"
                  : "No tasks yet."}
            </p>
          )}
          {visible.map((todo) => (
            <Card key={todo.id} className="p-4">
              <div className="flex items-center gap-4">
                <Checkbox
                  id={`todo-${todo.id}`}
                  checked={todo.done}
                  disabled={busy.has(todo.id)}
                  onCheckedChange={(checked) => toggle(todo, checked === true)}
                />
                <label
                  htmlFor={`todo-${todo.id}`}
                  className={`flex-1 text-sm ${
                    todo.done
                      ? "text-muted-foreground line-through"
                      : "text-foreground"
                  }`}
                >
                  {todo.title}
                  {view !== "day" && (
                    <span className="mt-0.5 block text-xs text-muted-foreground no-underline">
                      {format(fromKey(todo.date), "d MMM yyyy")}
                      {!todo.done && todo.date < todayKey ? " · overdue" : ""}
                    </span>
                  )}
                </label>
                <button
                  type="button"
                  onClick={() => remove(todo)}
                  disabled={busy.has(todo.id)}
                  aria-label={`Delete task: ${todo.title}`}
                  className="text-muted-foreground hover:text-destructive disabled:opacity-50"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default TodoListClient;
