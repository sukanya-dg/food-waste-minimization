const wrapper = document.querySelector(".wrapper");
const baseUrl = window.location.origin;
const registerLink = document.querySelector(".register-link");
const loginLink = document.querySelector(".login-link");

// Toggle between Login and Sign Up forms
if (registerLink && loginLink) {
    registerLink.onclick = () => {
        wrapper.classList.add("active");
    };

    loginLink.onclick = () => {
        wrapper.classList.remove("active");
    };
}

// Handle Signup & Login Form Submissions
document.addEventListener("DOMContentLoaded", function () {
    const signupForm = document.getElementById("signup-form");
    const loginForm = document.getElementById("login-form");

    // Handle Signup Submission
    if (signupForm) {
        signupForm.addEventListener("submit", async function (event) {
            event.preventDefault(); // Prevent default form submission

            const companynameField = document.getElementById("signup-companyname");
            const emailField = document.getElementById("signup-email");
            const passwordField = document.getElementById("signup-password");

            if (!companynameField || !emailField || !passwordField) {
                alert("Signup input fields not found in HTML.");
                return;
            }

            const companyname = companynameField.value.trim();
            const email = emailField.value.trim();
            const password = passwordField.value.trim();

            if (!companyname || !email || !password) {
                alert("Please fill in all fields.");
                return;
            }

            try {
                const response = await fetch(`${baseUrl}/api/donor/signup`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ companyname, email, password }),
                });

                const data = await response.json();

                if (data.success) {
                    // Store companyname in localStorage after signup
                    localStorage.setItem("donorcompanyname", data.companyname);
                    window.location.href = data.redirect; // Redirect to donor_dashboard.html
                } else {
                    alert(data.message);
                }
            } catch (error) {
                console.error("Signup Error:", error);
                alert("An error occurred while signing up. Please try again.");
            }
        });
    }

    // Handle Login Submission
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
                const response = await fetch(`${baseUrl}/api/donor/login`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email, password }),
                });

                const data = await response.json();

                if (data.success) {
                    // Store companyname in localStorage after login
                    localStorage.setItem("donorcompanyname", data.companyname);
                    window.location.href = data.redirect; // Redirect to donor_dashboard.html
                } else {
                    alert(data.message);
                }
            } catch (error) {
                console.error("Login Error:", error);
                alert("An error occurred while logging in. Please try again.");
            }
        });
    }

    // Update the donor dashboard element with the stored company name.
    // Now targeting the element with id "company-name"
    const donorName = localStorage.getItem("donorcompanyname");
    if (donorName) {
        const donorNameEl = document.getElementById("company-name");
        if (donorNameEl) donorNameEl.innerText = donorName;
    } else {
        const donorNameEl = document.getElementById("company-name");
        if (donorNameEl) donorNameEl.innerText = "Unknown Donor";
    }
});

document.getElementById("startVerification")?.addEventListener("click", async () => {
    try {
        const response = await fetch(`${baseUrl}/api/donor/start-fssai-verification`, {
            method: "POST"
        });
        const data = await response.json();

        if (response.ok) {
            document.getElementById("verificationStatus").innerText = "FSSAI website opened. Enter details manually.";
        } else {
            document.getElementById("verificationStatus").innerText = "Error: " + data.error;
        }
    } catch (error) {
        console.error("Error:", error);
        document.getElementById("verificationStatus").innerText = "Failed to open FSSAI website.";
    }
});

