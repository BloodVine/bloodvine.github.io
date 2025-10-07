// contact.js
const contactForm = document.getElementById('contactForm');
const contactStatus = document.getElementById('contactStatus');

if (contactForm) {
  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const message = document.getElementById('message').value.trim();

    contactStatus.innerText = 'Sending...';

    try {
      const resp = await emailjs.send(ENV.EMAILJS_SERVICE_ID, ENV.EMAILJS_TEMPLATE_ID, {
        from_name: name,
        from_email: email,
        message
      });
      contactStatus.innerText = 'Message sent — thanks!';
      contactForm.reset();
    } catch (err) {
      console.error(err);
      contactStatus.innerText = 'Failed to send message.';
    }
  });
}
