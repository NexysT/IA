// ============================================
// SISTEMA DE PARTÍCULAS AVANÇADO
// ============================================

class ParticleSystem {
    constructor() {
        this.canvas = document.getElementById('particleCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.particleCount = 100;
        this.mouse = { x: null, y: null, radius: 150 };
        
        this.init();
    }
    
    init() {
        this.resizeCanvas();
        this.createParticles();
        this.animate();
        
        // Event listeners
        window.addEventListener('resize', () => this.resizeCanvas());
        window.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        
        // Em mobile, reduzir partículas para performance
        if (window.innerWidth < 768) {
            this.particleCount = 50;
        }
    }
    
    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    
    createParticles() {
        this.particles = [];
        for (let i = 0; i < this.particleCount; i++) {
            this.particles.push(new Particle(this.canvas, this.mouse));
        }
    }
    
    handleMouseMove(e) {
        this.mouse.x = e.clientX;
        this.mouse.y = e.clientY;
    }
    
    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Atualizar e desenhar partículas
        this.particles.forEach(particle => {
            particle.update();
            particle.draw(this.ctx);
        });
        
        // Conectar partículas próximas
        this.connectParticles();
        
        requestAnimationFrame(() => this.animate());
    }
    
    connectParticles() {
        for (let i = 0; i < this.particles.length; i++) {
            for (let j = i + 1; j < this.particles.length; j++) {
                const dx = this.particles[i].x - this.particles[j].x;
                const dy = this.particles[i].y - this.particles[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < 120) {
                    const opacity = (1 - distance / 120) * 0.3;
                    this.ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
                    this.ctx.lineWidth = 0.5;
                    this.ctx.beginPath();
                    this.ctx.moveTo(this.particles[i].x, this.particles[i].y);
                    this.ctx.lineTo(this.particles[j].x, this.particles[j].y);
                    this.ctx.stroke();
                }
            }
        }
    }
}

// ============================================
// CLASSE PARTÍCULA
// ============================================

class Particle {
    constructor(canvas, mouse) {
        this.canvas = canvas;
        this.mouse = mouse;
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 3 + 1;
        this.baseSize = this.size;
        this.speedX = (Math.random() - 0.5) * 0.5;
        this.speedY = Math.random() * 0.5 + 0.2;
        this.opacity = Math.random() * 0.5 + 0.3;
    }
    
    update() {
        // Movimento básico
        this.x += this.speedX;
        this.y += this.speedY;
        
        // Física de gravidade
        this.speedY += 0.01;
        
        // Interação com o rato
        const dx = this.mouse.x - this.x;
        const dy = this.mouse.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < this.mouse.radius) {
            const force = (this.mouse.radius - distance) / this.mouse.radius;
            const angle = Math.atan2(dy, dx);
            this.x -= Math.cos(angle) * force * 3;
            this.y -= Math.sin(angle) * force * 3;
            this.size = this.baseSize * (1 + force);
        } else {
            this.size = this.baseSize;
        }
        
        // Resetar quando sair da tela
        if (this.y > this.canvas.height) {
            this.y = -10;
            this.x = Math.random() * this.canvas.width;
            this.speedY = Math.random() * 0.5 + 0.2;
        }
        
        if (this.x < 0 || this.x > this.canvas.width) {
            this.speedX *= -1;
        }
    }
    
    draw(ctx) {
        ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
        ctx.shadowBlur = 10;
        ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    }
}

// ============================================
// SISTEMA DE NAVEGAÇÃO DOS PROJETOS
// ============================================

class ProjectNavigation {
    constructor() {
        this.cards = document.querySelectorAll('.project-card');
        this.transition = document.querySelector('.page-transition');
        this.init();
    }
    
    init() {
        this.cards.forEach(card => {
            // Efeito 3D ao movimento do rato
            card.addEventListener('mousemove', (e) => this.handleCardHover(e, card));
            card.addEventListener('mouseleave', () => this.resetCard(card));
            
            // Click para navegar
            card.addEventListener('click', () => this.navigateToProject(card));
        });
    }
    
    handleCardHover(e, card) {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        const rotateX = (y - centerY) / 10;
        const rotateY = (centerX - x) / 10;
        
        const cardInner = card.querySelector('.card-inner');
        cardInner.style.transform = `
            translateY(-15px) 
            rotateX(${rotateX}deg) 
            rotateY(${rotateY}deg) 
            scale(1.05)
        `;
    }
    
    resetCard(card) {
        const cardInner = card.querySelector('.card-inner');
        cardInner.style.transform = '';
    }
    
    navigateToProject(card) {
        const projectName = card.getAttribute('data-project');
        
        // Animação de saída
        this.transition.classList.add('active');
        
        // Adicionar efeito de "explosão" no card clicado
        card.style.transform = 'scale(1.1)';
        card.style.opacity = '0';
        
        // Navegar após animação
        setTimeout(() => {
            window.location.href = `${projectName}/index.html`;
        }, 500);
    }
}

// ============================================
// EFEITOS ADICIONAIS E OTIMIZAÇÕES
// ============================================

class EnhancedEffects {
    constructor() {
        this.init();
    }
    
    init() {
        // Parallax suave no scroll
        this.setupParallax();
        
        // Animações de entrada
        this.setupIntersectionObserver();
        
        // Performance monitor
        this.optimizeForDevice();
    }
    
    setupParallax() {
        let ticking = false;
        
        window.addEventListener('scroll', () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    const scrolled = window.pageYOffset;
                    const header = document.querySelector('.header');
                    if (header) {
                        header.style.transform = `translateY(${scrolled * 0.3}px)`;
                        header.style.opacity = 1 - scrolled / 500;
                    }
                    ticking = false;
                });
                ticking = true;
            }
        });
    }
    
    setupIntersectionObserver() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, { threshold: 0.1 });
        
        document.querySelectorAll('.project-card').forEach(card => {
            observer.observe(card);
        });
    }
    
    optimizeForDevice() {
        // Detectar dispositivo e ajustar efeitos
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        
        if (isMobile) {
            // Reduzir animações complexas em mobile
            document.body.classList.add('mobile-device');
        }
        
        // Detectar performance baixa
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        if (connection && connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
            document.body.classList.add('low-performance');
        }
    }
}

// ============================================
// INICIALIZAÇÃO
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    // Inicializar sistema de partículas
    const particleSystem = new ParticleSystem();
    
    // Inicializar navegação
    const navigation = new ProjectNavigation();
    
    // Inicializar efeitos avançados
    const effects = new EnhancedEffects();
    
    // Log de boas-vindas
    console.log('%c🚀 Portfólio Carregado com Sucesso! ', 'background: #6366f1; color: white; font-size: 16px; padding: 10px;');
    console.log('%cDesenvolvido com HTML, CSS e JavaScript avançado', 'color: #8b5cf6; font-size: 12px;');
});

// ============================================
// PREVENÇÃO DE ERROS E FALLBACKS
// ============================================

window.addEventListener('error', (e) => {
    console.error('Erro capturado:', e.message);
});

// Prevenir comportamento padrão em alguns casos
document.addEventListener('dragstart', (e) => {
    if (e.target.classList.contains('project-card')) {
        e.preventDefault();
    }
});