// This is the base URL of your backend API
// In development it's localhost:4000
// In production it reads from the environment variable
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

// ─── Main fetch helper ────────────────────────────────────────────────────────
// This wraps the built-in fetch() with our common settings
// so we don't repeat them on every single request

// endpoint: the path like '/api/auth/login'
// options:  extra options like { method: 'POST', body: {...} }
export async function apiFetch(endpoint, options = {}) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    // Always send and receive JSON
    headers: {
      "Content-Type": "application/json",
      // Spread any extra headers the caller passes in
      ...options.headers,
    },

    // "credentials: include" is CRITICAL
    // This tells the browser to send cookies with every request
    // Without this, your JWT cookies would never be sent to the backend
    credentials: "include",

    // Spread the rest of the options (method, body, etc.)
    ...options,

    // If a body object is passed, convert it to a JSON string
    // fetch() requires the body to be a string, not an object
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  // Parse the JSON response
  const data = await response.json();

  // If the response status is not 2xx (like 400, 401, 500)
  // throw an error with the message from the backend
  if (!response.ok) {
    throw new Error(data.message || "Something went wrong");
  }

  return data;
}

// ─── Shortcut helpers ─────────────────────────────────────────────────────────
// These make calling the API cleaner in your components

export const api = {
  // GET request — for fetching data
  get: (endpoint) => apiFetch(endpoint),

  // POST request — for creating data or logging in
  post: (endpoint, body) => apiFetch(endpoint, { method: "POST", body }),

  // PATCH request — for updating part of a record
  patch: (endpoint, body) => apiFetch(endpoint, { method: "PATCH", body }),

  // DELETE request — for deleting a record
  delete: (endpoint) => apiFetch(endpoint, { method: "DELETE" }),
};
