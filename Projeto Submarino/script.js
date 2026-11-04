// --- NOVO DESIGN DO SUBMARINO ---
const sub = {
    x: 450, y: 400, w: 110, h: 50,
    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);

        // Brilho do Farol com "Névoa"
        const beam = ctx.createRadialGradient(100, 25, 0, 100, 25, 300);
        beam.addColorStop(0, 'rgba(0, 255, 255, 0.4)');
        beam.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = beam;
        ctx.beginPath(); ctx.moveTo(100, 25); ctx.lineTo(400, -150); ctx.lineTo(400, 200); ctx.fill();

        // Casco com Gradiente 3D (Simula Volume)
        const hull = ctx.createLinearGradient(0, 0, 0, 50);
        hull.addColorStop(0, '#ffd700'); // Topo iluminado
        hull.addColorStop(0.5, '#daa520'); // Cor base
        hull.addColorStop(1, '#5a4900'); // Base na sombra
        
        ctx.fillStyle = hull;
        ctx.beginPath();
        ctx.ellipse(50, 25, 55, 25, 0, 0, Math.PI * 2);
        ctx.fill();

        // Janelas (Vidro com reflexo)
        ctx.fillStyle = "#001a33";
        for(let i=0; i<3; i++) {
            ctx.beginPath(); ctx.arc(30 + (i*20), 25, 7, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = "white"; // Reflexo do vidro
            ctx.fillRect(28 + (i*20), 22, 3, 3);
            ctx.fillStyle = "#001a33";
        }

        // Hélice (Animação de Rotação)
        ctx.fillStyle = "#222";
        let propH = Math.sin(frame * 0.5) * 20;
        ctx.fillRect(-5, 25 - propH/2, 5, propH);
        
        ctx.restore();
    }
};

// --- NOVO DESIGN DOS NAVIOS ---
function drawBoat(b) {
    // Sombra na água
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.fillRect(b.x + 5, b.y + 35, b.w, 10);

    // Casco Metálico
    const shipGrad = ctx.createLinearGradient(b.x, b.y, b.x, b.y + 40);
    shipGrad.addColorStop(0, '#7f8c8d');
    shipGrad.addColorStop(1, '#2c3e50');
    
    ctx.fillStyle = shipGrad;
    ctx.beginPath();
    ctx.moveTo(b.x, b.y);
    ctx.lineTo(b.x + b.w, b.y);
    ctx.lineTo(b.x + b.w - 20, b.y + 40);
    ctx.lineTo(b.x + 20, b.y + 40);
    ctx.closePath();
    ctx.fill();

    // Janelas do Comando
    ctx.fillStyle = "#3498db";
    ctx.fillRect(b.x + 40, b.y - 15, 30, 10);
}