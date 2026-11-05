import mongoose, { Schema, type Model } from "mongoose";

export type TodoPlain = {
  /** Clerk user id of the admin who owns the task. */
  userId: string;
  title: string;
  /** Day the task is for, "YYYY-MM-DD" (Uganda time). */
  date: string;
  done: boolean;
  createdAt?: Date;
  updatedAt?: Date;
};

const todoSchema = new Schema<TodoPlain>(
  {
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    date: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
    done: { type: Boolean, default: false },
  },
  { timestamps: true },
);

todoSchema.index({ userId: 1, date: -1 });

export const Todo: Model<TodoPlain> =
  (mongoose.models.Todo as Model<TodoPlain> | undefined) ||
  mongoose.model<TodoPlain>("Todo", todoSchema);