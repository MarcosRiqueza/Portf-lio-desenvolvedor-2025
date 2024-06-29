// Função para rolagem suave
document.querySelectorAll('nav ul li a').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
    });
});

// Alerta de boas-vindas
window.addEventListener('load', () => {
    alert('Bem-vindo ao meu portfólio!');
});
