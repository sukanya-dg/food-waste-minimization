const wrapper = document.querySelector(".wrapper");
const baseUrl = window.location.origin;
const registerLink = document.querySelector(".register-link");
const loginLink = document.querySelector(".login-link");

// ✅ Toggle between Login and Sign Up forms
if (registerLink && loginLink) {
    registerLink.onclick = () => {
        wrapper.classList.add("active");
    };

    loginLink.onclick = () => {
        wrapper.classList.remove("active");
    };
}

// ✅ Handle Signup & Login Form Submissions
document.addEventListener("DOMContentLoaded", function () {
    const signupForm = document.getElementById("signup-form");
    const loginForm = document.getElementById("login-form");

// ✅ Handle Signup Submission
if (signupForm) {
    signupForm.addEventListener("submit", async function (event) {
        event.preventDefault(); // Prevent default form submission

        const userField = document.getElementById("signup-username");
        const emailField = document.getElementById("signup-email");
        const passwordField = document.getElementById("signup-password");

        if (!userField || !emailField || !passwordField) {
            alert("Signup input fields not found in HTML.");
            return;
        }

        const user = userField.value.trim();
        const email = emailField.value.trim();
        const password = passwordField.value.trim();

        if (!user || !email || !password) {
            alert("Please fill in all fields.");
            return;
        }

        try {
            const response = await fetch(`${baseUrl}/api/customer/signup`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ user, email, password }),
            });

            const data = await response.json();

            if (data.success) {
                // ✅ Store user in localStorage after signup
                localStorage.setItem("customerserviceuser", data.user);

                window.location.href = data.redirect; // ✅ Redirect to customerservice_dashboard.html
            } else {
                alert(data.message);
            }
        } catch (error) {
            console.error("Signup Error:", error);
            alert("An error occurred while signing up. Please try again.");
        }
    });
}

    // ✅ Handle Login Submission
    if (loginForm) {
        loginForm.addEventListener("submit", async function (event) {
            event.preventDefault();

            const email = document.getElementById("login-email")?.value.trim();
            const password = document.getElementById("login-password")?.value.trim();

            if (!email || !password) {
                alert("Please enter your email and password.");
                return;
            }

            try {
                const response = await fetch(`${baseUrl}/api/customer/login`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email, password }),
                });

                const data = await response.json();

                if (data.success) {
                    // ✅ Store user in localStorage after login
                    localStorage.setItem("customerserviceuser", data.user);

                    window.location.href = data.redirect; // ✅ Redirect to customerservice_dashboard.html
                } else {
                    alert(data.message);
                }
            } catch (error) {
                console.error("Login Error:", error);
                alert("An error occurred while logging in. Please try again.");
            }
        });
    }
});
