const wrapper = document.querySelector(".wrapper");
const registerLink = document.querySelector(".register-link");
const loginLink = document.querySelector(".login-link");

if (registerLink && loginLink) {
  registerLink.onclick = () => wrapper.classList.add("active");
  loginLink.onclick = () => wrapper.classList.remove("active");
}

document.addEventListener("DOMContentLoaded", async () => {
  const signupForm = document.getElementById("signup-form");
  const loginForm = document.getElementById("login-form");
  const verifyBtn = document.getElementById("verifyNow");

  // ----------------------------
  // 1) Handle Signup
  // ----------------------------
  if (signupForm) {
    signupForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      const nponame = document.getElementById("signup-nponame")?.value.trim();
      const regno = document.getElementById("signup-regno")?.value.trim();
      const email = document.getElementById("signup-email")?.value.trim();
      const password = document.getElementById("signup-password")?.value.trim();

      if (!nponame || !regno || !email || !password) {
        alert("Please fill in all fields.");
        return;
      }

      try {
        const response = await fetch("http://localhost:3000/api/receiver/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nponame, regno, email, password }),
        });

        const data = await response.json();
        if (data.success) {
          localStorage.setItem("receivernponame", data.nponame);
          window.location.href = data.redirect;
        } else {
          alert(data.message);
        }
      } catch {
        alert("An error occurred while signing up. Please try again.");
      }
    });
  }

  // ----------------------------
  // 2) Handle Login
  // ----------------------------
  if (loginForm) {
    loginForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      const email = document.getElementById("login-email")?.value.trim();
      const password = document.getElementById("login-password")?.value.trim();

      if (!email || !password) {
        alert("Please enter your email and password.");
        return;
      }

      try {
        const response = await fetch("http://localhost:3000/api/receiver/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        const data = await response.json();
        if (data.success) {
          localStorage.setItem("receivernponame", data.nponame);
          window.location.href = data.redirect;
        } else {
          alert(data.message);
        }
      } catch {
        alert("An error occurred while logging in. Please try again.");
      }
    });
  }

  // ----------------------------
  // 3) On Dashboard Load: Update UI Based on DB Details
  // ----------------------------
  const storedNpoName = localStorage.getItem("receivernponame");
  if (storedNpoName) {
    // Immediately set the NPO name from localStorage
    const npoNameElem = document.getElementById("npo-name");
    if (npoNameElem) {
      npoNameElem.textContent = storedNpoName;
    }

    // Fetch receiver details from backend
    try {
      const detailsResponse = await fetch("http://localhost:3000/api/receiver/details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nponame: storedNpoName }),
      });
      const detailsData = await detailsResponse.json();
      if (detailsData.success && detailsData.verified) {
        const verifyBtnElem = document.getElementById("verifyNow");
        if (verifyBtnElem) {
          verifyBtnElem.textContent = "Verified ✅";
          verifyBtnElem.disabled = true;
        }
        if (detailsData.address) {
          document.getElementById("npo-address").textContent = detailsData.address;
        }
      } else {
        // If not verified, ensure the button shows "Verify Now"
        if (verifyBtn) {
          verifyBtn.textContent = "Verify Now";
          verifyBtn.disabled = false;
        }
      }
    } catch (err) {
      console.error("Error fetching receiver details:", err);
    }
  }

  // ----------------------------
  // 4) Verify Button Click Handler
  // ----------------------------
  verifyBtn?.addEventListener("click", async () => {
    const storedNpoName = localStorage.getItem("receivernponame");
    if (!storedNpoName) {
      alert("No NGO name found in localStorage. Please log in or sign up first.");
      return;
    }

    // Set button to "Verifying..."
    verifyBtn.textContent = "Verifying...";
    verifyBtn.disabled = true;

    try {
      const response = await fetch("http://localhost:3000/api/receiver/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nponame: storedNpoName }),
      });
      const data = await response.json();
      if (data.verified) {
        verifyBtn.textContent = "Verified ✅";
        if (data.address) {
          document.getElementById("npo-address").textContent = data.address;
        }
      } else {
        alert(data.message || "Verification failed or mismatch.");
        verifyBtn.textContent = "Verify Now";
        verifyBtn.disabled = false;
      }
    } catch (err) {
      alert("Error verifying NGO. Check console for details.");
      console.error(err);
      verifyBtn.textContent = "Verify Now";
      verifyBtn.disabled = false;
    }
  });
});
