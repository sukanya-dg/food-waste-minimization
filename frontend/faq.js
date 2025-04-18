document.addEventListener('DOMContentLoaded', function() {
    const faqs = document.querySelectorAll(".faq");
    const plusIcons = document.querySelectorAll(".fa-solid.fa-plus");

    // Function to toggle FAQ
    function toggleFAQ(faq) {
        // Close all other FAQs
        faqs.forEach(item => {
            if (item !== faq && item.classList.contains("active")) {
                item.classList.remove("active");
                const icon = item.querySelector(".fa-solid");
                if (icon) {
                    icon.classList.remove("fa-minus");
                    icon.classList.add("fa-plus");
                }
            }
        });

        // Toggle current FAQ
        faq.classList.toggle("active");
        
        // Toggle icon
        const icon = faq.querySelector(".fa-solid");
        if (icon) {
            if (faq.classList.contains("active")) {
                icon.classList.remove("fa-plus");
                icon.classList.add("fa-minus");
                icon.style.color = "#74A57F"; // Change icon color when active
            } else {
                icon.classList.remove("fa-minus");
                icon.classList.add("fa-plus");
                icon.style.color = "#2d7070"; // Reset icon color when inactive
            }
        }
    }

    // Add click event to each FAQ
    faqs.forEach(faq => {
        faq.addEventListener("click", () => {
            toggleFAQ(faq);
        });
    });

    // Add keyboard accessibility
    faqs.forEach(faq => {
        faq.setAttribute("tabindex", "0");
        faq.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                toggleFAQ(faq);
            }
        });
    });
});