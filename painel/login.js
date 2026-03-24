const PANEL_SESSION_KEY = "dilson_admin_session";
const PANEL_USERNAME = "admin";
const PANEL_PASSWORD = "admin";

const loginForm = document.querySelector("#login-form");
const loginStatus = document.querySelector("#login-status");

if (window.localStorage.getItem(PANEL_SESSION_KEY) === "true") {
  window.location.replace("/painel/dashboard");
}

if (loginForm) {
  loginForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const username = document.querySelector("#login-username")?.value.trim();
    const password = document.querySelector("#login-password")?.value.trim();

    if (username !== PANEL_USERNAME || password !== PANEL_PASSWORD) {
      loginStatus.textContent = "Login ou senha inválidos.";
      return;
    }

    window.localStorage.setItem(PANEL_SESSION_KEY, "true");
    loginStatus.textContent = "";
    window.location.replace("/painel/dashboard");
  });
}
