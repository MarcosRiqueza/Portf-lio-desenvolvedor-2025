window.addEventListener('load', () => {
    const sections = document.querySelectorAll('section');
    sections.forEach((section) => {
        section.classList.add('fade-in');
    });
});