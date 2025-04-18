const wrapper = document.querySelector(".wrapper");
const baseUrl = window.location.origin;
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
        const response = await fetch(`${baseUrl}/api/receiver/signup`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nponame, regno, email, password }),
        });

        const data = await response.json();
        if (data.success) {
          localStorage.setItem("receiverId", data._id); // ✅ Add this line
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
        const response = await fetch(`${baseUrl}/api/receiver/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
          credentials: "include"
        });

        const data = await response.json();
        console.log("Login response:", data); // Debug log

        if (data.success) {
          // Store receiver ID and name in localStorage
          localStorage.setItem("receiverId", data.id);
          localStorage.setItem("receivernponame", data.nponame);

          // Clear any existing error messages
          const errorMessage = document.querySelector(".error-message");
          if (errorMessage) {
            errorMessage.remove();
          }

          // Redirect to dashboard
          window.location.href = data.redirect;
        } else {
          // Show error message
          const errorMessage = document.createElement("div");
          errorMessage.className = "error-message text-red-500 mt-2";
          errorMessage.textContent = data.message || "Login failed. Please try again.";

          // Remove any existing error message
          const existingError = document.querySelector(".error-message");
          if (existingError) {
            existingError.remove();
          }

          // Add new error message after the login button
          const loginButton = loginForm.querySelector("button[type='submit']");
          loginButton.parentNode.insertBefore(errorMessage, loginButton.nextSibling);
        }
      } catch (error) {
        console.error("Login error:", error);
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
      const detailsResponse = await fetch(`${baseUrl}/api/receiver/details`, {
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
      const response = await fetch(`${baseUrl}/api/receiver/verify`, {
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

  // Initialize the dashboard
  if (document.querySelector("#request-list")) {
    fetchReceiverRequests();
    // Refresh requests periodically
    setInterval(fetchReceiverRequests, 30000); // Every 30 seconds
  }
});

// Add this function to fetch receiver requests
async function fetchReceiverRequests() {
  try {
    const receiverId = localStorage.getItem("receiverId");
    if (!receiverId) {
      console.error("No receiver ID found");
      return;
    }

    const response = await fetch(`${baseUrl}/api/donations/receiver-requests?receiverId=${receiverId}`, {
      credentials: 'include'
    });
    const requests = await response.json();

    const requestList = document.querySelector("#request-list tbody");
    if (!requestList) return;

    requestList.innerHTML = "";

    requests.forEach(request => {
      const row = document.createElement("tr");
      const statusColor = request.status === 'Pending'
        ? 'text-yellow-500'
        : request.status === 'Confirmed'
          ? 'text-green-500'
          : 'text-gray-500';

      row.innerHTML = `
        <td class="p-2">${request.title}</td>
        <td class="p-2">${request.donorId ? request.donorId.name : 'Unknown Restaurant'}</td>
        <td class="p-2 ${statusColor}">${request.status}</td>
        <td class="p-2">
          ${request.status === 'Confirmed' ? `
            <button class="bg-green-500 text-white px-2 py-1 rounded collect-btn" 
              data-id="${request._id}">
              Collect
            </button>
          ` : ''}
        </td>
      `;
      requestList.appendChild(row);
    });

    // Add event listeners to collect buttons
    document.querySelectorAll('.collect-btn').forEach(button => {
      button.addEventListener('click', function () {
        markAsCollected(this.dataset.id);
      });
    });
  } catch (error) {
    console.error('Error fetching requests:', error);
  }
}

function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    sidebar.classList.toggle('active');
}