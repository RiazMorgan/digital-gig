const contactForm = document.getElementById("contactForm");
const submitBtn = document.getElementById("submitBtn");
const statusMessage = document.getElementById("statusMessage");
const btnText = document.getElementById("btnText");

contactForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const formData = new FormData(contactForm);

  submitBtn.disabled = true;
  btnText.textContent = "Sending...";
  statusMessage.style.display = "block";
  statusMessage.textContent = "Sending...";

  try {
    const response = await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      body: formData,
    });

    const json = await response.json();

    if (json.success) {
      statusMessage.textContent = "Message sent successfully. Redirecting...";
      statusMessage.className = "message success";
      contactForm.reset();

      // Check if the form has a redirect instruction
      const redirectUrl = contactForm.getAttribute("data-redirect");
      if (redirectUrl) {
        setTimeout(() => {
          window.location.href = redirectUrl;
        }, 2000); // Wait 2 seconds before redirecting
      }
      c;
    } else {
      statusMessage.textContent = "Failed to send message. Try again.";
      statusMessage.className = "message error";
      console.error(json);
    }
  } catch (err) {
    statusMessage.textContent = "Network error. Please try again later.";
    statusMessage.className = "message error";
  } finally {
    submitBtn.disabled = false;
    btnText.textContent = "Send Message";
    setTimeout(() => {
      window.location.href = "#contact";
    }, 2000);
  }
});
