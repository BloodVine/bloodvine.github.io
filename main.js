document.addEventListener('DOMContentLoaded', function () {
    const mobileMenu = document.querySelector('.mobile-menu');
    const navMenu = document.querySelector('nav ul');

    if (mobileMenu && navMenu) {
        mobileMenu.addEventListener('click', function() {
            navMenu.style.display = navMenu.style.display === 'flex' ? 'none' : 'flex';
        });

        // Close mobile menu when clicking on a link
        document.querySelectorAll('nav ul li a').forEach(link => {
            link.addEventListener('click', function() {
                if (window.innerWidth <= 768) {
                    navMenu.style.display = 'none';
                }
            });
        });
    }
});
document.getElementById('loginBtn').addEventListener('click', () => {
    window.location.href = 'login.html';
});
document.getElementById('signupBtn').addEventListener('click', () => {
    window.location.href = 'signup.html';
});
