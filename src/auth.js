const TOKEN_KEY = "verifyhub_token";
const USER_KEY = "verifyhub_user";
const ROLE_KEY = "verifyhub_role";

export const ROLE_HOME = {
  admin: "/super-admin/overview",
  retailer: "/retailer/overview",
};

// "Keep me signed in" stores the session in localStorage; otherwise it lives
// in sessionStorage and ends when the browser tab is closed.
const read = (key) =>
  localStorage.getItem(key) ?? sessionStorage.getItem(key);

export const getToken = () => read(TOKEN_KEY);

export const getRole = () => read(ROLE_KEY);

export const getUser = () => {
  try {
    return JSON.parse(read(USER_KEY) || "null");
  } catch {
    return null;
  }
};

export const clearSession = () => {
  [localStorage, sessionStorage].forEach((store) => {
    [TOKEN_KEY, USER_KEY, ROLE_KEY].forEach((key) => store.removeItem(key));
  });
};

// Merge profile changes into the stored user, in whichever storage holds the session.
export const updateStoredUser = (patch) => {
  const store = localStorage.getItem(TOKEN_KEY) ? localStorage : sessionStorage;
  store.setItem(USER_KEY, JSON.stringify({ ...(getUser() || {}), ...patch }));
};

export const saveSession = ({ token, role, user }, remember) => {
  clearSession();

  const store = remember ? localStorage : sessionStorage;
  store.setItem(TOKEN_KEY, token);
  store.setItem(ROLE_KEY, role);

  if (user) {
    store.setItem(USER_KEY, JSON.stringify(user));
  }
};
