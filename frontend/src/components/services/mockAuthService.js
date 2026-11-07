const USERS_KEY = "aradquest_dev_users";
const SESSION_KEY = "aradquest_dev_session";

// Read mock accounts stored in this browser.
function readUsers() {
  try {
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
    return Array.isArray(users) ? users : [];
  } catch {
    return [];
  }
}

// Remove private fields from the public user profile.
function toPublicUser(user) {
  const publicUser = { ...user };
  delete publicUser.password;
  return publicUser;
}

// Register a development-only account.
export async function mockRegisterUser(username, email, password) {
  const users = readUsers();
  const normalizedEmail = email.trim().toLowerCase();

  if (users.some((user) => user.email === normalizedEmail)) {
    throw new Error("An account with this email already exists.");
  }

  const newUser = {
    id: crypto.randomUUID(),
    username: username.trim(),
    email: normalizedEmail,
    password,
    total_points: 0,
  };

  users.push(newUser);
  localStorage.setItem(USERS_KEY, JSON.stringify(users));

  return {
    status: "succes",
    user_id: newUser.id,
  };
}

// Authenticate a mock account.
export async function mockLoginUser(email, password) {
  const users = readUsers();
  const normalizedEmail = email.trim().toLowerCase();

  const user = users.find(
    (account) =>
      account.email === normalizedEmail && account.password === password,
  );

  if (!user) {
    throw new Error("Invalid email or password.");
  }

  localStorage.setItem(SESSION_KEY, user.id);

  return {
    user: toPublicUser(user),
  };
}

// Restore the mock session after refreshing the page.
export async function mockGetCurrentUser() {
  const userId = localStorage.getItem(SESSION_KEY);

  if (!userId) {
    return null;
  }

  const user = readUsers().find((account) => account.id === userId);

  if (!user) {
    localStorage.removeItem(SESSION_KEY);
    return null;
  }

  return toPublicUser(user);
}

// Log out from the mock session.
export async function mockLogoutUser() {
  localStorage.removeItem(SESSION_KEY);
}
