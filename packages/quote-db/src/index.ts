export {
  Quote,
  QuoteTypes,
  QuoteStatuses,
  EmailStatuses,
  type QuoteItem,
  type QuotePlain,
  type QuoteType,
  type QuoteStatus,
  type QuoteEmailStatus,
} from "./quote-model";

export { connectQuoteDB } from "./connection";
export {
  createQuote,
  markQuoteEmail,
  getQuotes,
  getQuoteByReference,
  countNewQuotes,
  setQuoteStatus,
  type NewQuote,
} from "./queries";
export { srvToStandardUri } from "./srv";

// Admin dashboard todo list (shares this package's MongoDB connection).
export { Todo, type TodoPlain } from "./todo-model";
export {
  listTodos,
  createTodo,
  setTodoDone,
  deleteTodo,
  type TodoView,
} from "./todo-queries";