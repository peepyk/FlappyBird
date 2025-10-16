class Game {
    constructor() {
        this.initializeProperties();
        this.loadAssets();
        this.setupEventListeners();
        this.setupCanvas();
        this.initUI();
        this.loadHighScore();
    }

    initializeProperties() {
        // Canvas and context
        this.canvas = null;
        this.ctx = null;
        
        // Dimensions
        this.frameHeight = window.innerHeight;
        this.frameWidth = Math.min(this.frameHeight * 0.5625, window.innerWidth);
        
        // Game state
        this.gameState = 'title'; // title, playing, paused, gameOver
        this.activeGame = false;
        this.score = 0;
        this.highScore = 0;
        this.combo = 0;
        this.lastScoreTime = 0;
        
        // Bird properties
        this.birdX = this.frameHeight * 0.117;
        this.birdY = this.frameHeight / 2;
        this.birdWidth = this.frameHeight * 0.1 * 0.5;
        this.birdHeight = this.frameHeight * 0.07 * 0.5;
        this.birdYVelocity = 0;
        this.birdRotation = 0;
        this.targetRotation = 0;
        this.birdGlow = 0;
        
        // Physics
        this.gravity = this.frameHeight * 0.0003225;
        this.jumpStrength = -this.frameHeight * 0.013859375 * 0.7;
        this.tolerance = 5;
        
        // Pipes
        this.pipes = [];
        this.pipeWidth = this.frameHeight * 0.078;
        this.pipeHeight = this.pipeWidth * 10;
        this.pipeOffset = this.frameHeight * 0.200;
        this.pipeVelocity = this.frameHeight * 0.0035625;
        
        // Ground
        this.groundHeight = this.frameHeight / 12;
        this.groundX = 0;
        
        // Particles
        this.particles = [];
        
        // Intervals
        this.pipeInterval = null;
        this.renderInterval = null;
        
        // Assets
        this.images = {};
        this.assetsLoaded = false;
    }

    loadAssets() {
        const assetList = {
            bird: 'img/bird.png',
            ground: 'img/ground.png',
            pipeTop: 'img/pipe_top.png',
            pipeBottom: 'img/pipe_bottom.png'
        };

        let loadedCount = 0;
        const totalAssets = Object.keys(assetList).length;

        Object.entries(assetList).forEach(([key, src]) => {
            const img = new Image();
            img.onload = () => {
                loadedCount++;
                if (loadedCount === totalAssets) {
                    this.assetsLoaded = true;
                    this.startIdleAnimation();
                }
            };
            img.onerror = () => {
                console.error(`Failed to load image: ${src}`);
                loadedCount++;
                if (loadedCount === totalAssets) {
                    this.assetsLoaded = true;
                    this.startIdleAnimation();
                }
            };
            img.src = src;
            this.images[key] = img;
        });
    }

    setupCanvas() {
        this.canvas = document.getElementById('frame');
        this.canvas.width = this.frameWidth;
        this.canvas.height = this.frameHeight;
        this.ctx = this.canvas.getContext('2d');
        
        // Enable image smoothing for better quality
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';
    }

    setupEventListeners() {
        // Click and touch events
        document.addEventListener('click', (e) => this.handleInput(e));
        document.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.handleInput(e);
        });
        
        // Keyboard events
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' || e.key === ' ') {
                e.preventDefault();
                this.handleInput(e);
            }
        });
        
        // Button events
        document.getElementById('start-btn')?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.startGame();
        });
        
        document.getElementById('restart-btn')?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.restartGame();
        });
        
        document.getElementById('menu-btn')?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.showTitleScreen();
        });
    }

    handleInput(e) {
        if (this.gameState === 'title') {
            // Don't start on button click
            if (e.target.tagName === 'BUTTON') return;
        } else if (this.gameState === 'playing') {
            this.jump();
        }
    }

    startGame() {
        this.gameState = 'playing';
        this.activeGame = true;
        this.score = 0;
        this.combo = 0;
        this.birdY = this.frameHeight / 2;
        this.birdYVelocity = 0;
        this.birdRotation = 0;
        this.pipes = [];
        this.particles = [];
        this.groundX = 0;
        
        this.showScreen('game-hud');
        this.updateScore();
        
        // Start spawning pipes
        this.randomPipeSet();
        this.pipeInterval = setInterval(() => this.randomPipeSet(), 1330);

        // Start render loop
        this.renderInterval = setInterval(() => this.renderLoop(), 1000 / 75);
    }

    restartGame() {
        this.startGame();
    }

    gameOver() {
        clearInterval(this.renderInterval);
        clearInterval(this.pipeInterval);
        this.activeGame = false;
        this.gameState = 'gameOver';
        this.gravity = this.frameHeight * 0.0003225; // Reset gravity
        this.pipeVelocity = this.frameHeight * 0.0035625; // Reset velocity
        this.birdYVelocity = 0;
        
        // Update high score
        if (this.score > this.highScore) {
            this.highScore = this.score;
            this.saveHighScore();
            this.updateHighScoreDisplay();
        }
        
        // Create explosion particles
        this.createExplosion(this.birdX + this.birdWidth / 2, 
                           this.birdY + this.birdHeight / 2, 20);
        
        // Show game over screen with delay
        setTimeout(() => {
            this.showGameOverScreen();
        }, 500);
    }

    showTitleScreen() {
        this.gameState = 'title';
        this.activeGame = false;
        this.birdY = this.frameHeight / 2;
        this.birdYVelocity = 0;
        this.birdRotation = 0;
        this.pipes = [];
        this.particles = [];
        this.gravity = this.frameHeight * 0.0003225;
        this.pipeVelocity = this.frameHeight * 0.0035625;
        
        clearInterval(this.renderInterval);
        clearInterval(this.pipeInterval);
        
        this.showScreen('title-screen');
        
        // Start idle animation
        this.startIdleAnimation();
    }

    initUI() {
        this.updateHighScoreDisplay();
    }

    loadHighScore() {
        const saved = localStorage.getItem('flappyBirdHighScore');
        this.highScore = saved ? parseInt(saved, 10) : 0;
    }

    saveHighScore() {
        localStorage.setItem('flappyBirdHighScore', this.highScore.toString());
    }

    updateHighScoreDisplay() {
        const highScoreElement = document.getElementById('high-score-value');
        if (highScoreElement) {
            highScoreElement.textContent = this.highScore;
        }
    }

    showScreen(screenId) {
        const screens = document.querySelectorAll('.screen');
        screens.forEach(screen => screen.classList.remove('active'));
        
        const targetScreen = document.getElementById(screenId);
        if (targetScreen) {
            targetScreen.classList.add('active');
        }
    }

    showGameOverScreen() {
        document.getElementById('final-score').textContent = this.score;
        document.getElementById('best-score').textContent = this.highScore;
        this.showScreen('game-over-screen');
    }

    jump() {
        if (this.activeGame) {
            this.birdYVelocity = this.jumpStrength;
            this.targetRotation = -25;
        }
    }

    updateScore() {
        const scoreElement = document.getElementById('current-score');
        if (scoreElement) {
            scoreElement.textContent = this.score;
            scoreElement.style.animation = 'none';
            setTimeout(() => {
                scoreElement.style.animation = 'scorePopIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
            }, 10);
        }
    }

    updateCombo() {
        const comboElement = document.getElementById('combo-indicator');
        if (comboElement && this.combo >= 3) {
            comboElement.textContent = `${this.combo}x Combo!`;
            comboElement.classList.add('active');
        } else if (comboElement) {
            comboElement.classList.remove('active');
        }
    }

    // Game logic
    randomPipeSet() {
        const pipeSet = {
            pipeTopX: this.frameWidth,
            pipeTopY: this.getRandomIntInclusive(-this.pipeHeight * 0.8, -this.pipeHeight * 0.25),
            pipePassed: false
        };
        this.pipes.push(pipeSet);
    }

    getRandomIntInclusive(min, max) {
        const minCeiled = Math.ceil(min);
        const maxFloored = Math.floor(max);
        return Math.floor(Math.random() * (maxFloored - minCeiled + 1) + minCeiled);
    }

    checkCollision() {
        const pipe = this.pipes[0];
        if (
            pipe &&
            this.birdX + (this.birdWidth - this.tolerance) > pipe.pipeTopX &&
            this.birdX < pipe.pipeTopX + (this.pipeWidth - this.tolerance) &&
            (this.birdY < pipe.pipeTopY + (this.pipeHeight - this.tolerance) ||
            this.birdY + (this.birdHeight - this.tolerance) > pipe.pipeTopY + this.pipeHeight + this.pipeOffset)
        ) {
            this.activeGame = false;
        }
    }

    update() {
        // Bird physics
        this.birdYVelocity += this.gravity;
        this.birdY += this.birdYVelocity;

        // Smooth bird rotation
        if (this.birdYVelocity > 0) {
            this.targetRotation = Math.min(90, this.birdYVelocity * 5);
        }
        this.birdRotation += (this.targetRotation - this.birdRotation) * 0.1;

        // Fade out bird glow
        if (this.birdGlow > 0) {
            this.birdGlow -= 0.03;
            if (this.birdGlow < 0) this.birdGlow = 0;
        }

        // Ground animation
        this.groundX -= this.pipeVelocity;
        if (-1 * this.groundX >= this.frameWidth) {
            this.groundX = 0;
        }

        // Remove off-screen pipes
        if (this.pipes[0]?.pipeTopX + this.pipeWidth < 0) {
            this.pipes.shift();
        }

        // Score when passing pipe
        if (this.pipes[0]?.pipePassed === false && 
            this.pipes[0]?.pipeTopX + this.pipeWidth < this.birdX) {
            this.score++;
            this.pipes[0].pipePassed = true;
            this.updateScore();
            
            // Trigger bird glow effect
            this.birdGlow = 1.0;
            
            // Show +1 text at bird's height
            this.showPlusOne(this.pipes[0].pipeTopX + this.pipeWidth / 2, this.birdY + this.birdHeight / 2);
            
            // Combo system
            const currentTime = Date.now();
            if (currentTime - this.lastScoreTime < 2000) {
                this.combo++;
            } else {
                this.combo = 1;
            }
            this.lastScoreTime = currentTime;
            this.updateCombo();
            
            // Create clean star burst effect at bird's height
            this.createStarBurst(this.pipes[0].pipeTopX + this.pipeWidth / 2, 
                               this.birdY + this.birdHeight / 2, 8);
        }

        // Check collision
        this.checkCollision();

        // Move pipes
        this.pipes.forEach((pipe) => (pipe.pipeTopX -= this.pipeVelocity));

        // Ground collision
        if (this.birdY + this.birdHeight + this.groundHeight > this.frameHeight) {
            this.activeGame = false;
        }

        // Update particles
        this.updateParticles();
    }

    draw() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.frameWidth, this.frameHeight);

        // Draw bird with rotation and glow effect
        this.ctx.save();
        this.ctx.translate(
            this.birdX + this.birdWidth / 2,
            this.birdY + this.birdHeight / 2
        );
        this.ctx.rotate((this.birdRotation * Math.PI) / 180);
        
        // Apply glow effect if active
        if (this.birdGlow > 0) {
            this.ctx.shadowColor = '#FFE66D';
            this.ctx.shadowBlur = 20 * this.birdGlow;
            this.ctx.shadowOffsetX = 0;
            this.ctx.shadowOffsetY = 0;
        }
        
        if (this.images.bird.complete) {
            this.ctx.drawImage(
                this.images.bird,
                -this.birdWidth / 2,
                -this.birdHeight / 2,
                this.birdWidth,
                this.birdHeight
            );
        }
        
        // Reset shadow
        this.ctx.shadowColor = 'transparent';
        this.ctx.shadowBlur = 0;
        
        this.ctx.restore();

        // Draw pipes
        this.pipes.forEach((pipe) => {
            if (this.images.pipeTop.complete) {
                this.ctx.drawImage(
                    this.images.pipeTop,
                    pipe.pipeTopX,
                    pipe.pipeTopY,
                    this.pipeWidth,
                    this.pipeHeight
                );
            }
            if (this.images.pipeBottom.complete) {
                this.ctx.drawImage(
                    this.images.pipeBottom,
                    pipe.pipeTopX,
                    pipe.pipeTopY + this.pipeHeight + this.pipeOffset,
                    this.pipeWidth,
                    this.pipeHeight
                );
            }
        });

        // Draw ground
        if (this.images.ground.complete) {
            this.ctx.drawImage(
                this.images.ground,
                this.groundX,
                this.frameHeight - this.groundHeight,
                this.frameWidth,
                this.groundHeight * 2
            );
            this.ctx.drawImage(
                this.images.ground,
                this.groundX + this.frameWidth - 1,
                this.frameHeight - this.groundHeight,
                this.frameWidth,
                this.groundHeight * 2
            );
        }

        // Draw particles
        this.particles.forEach(particle => {
            this.ctx.globalAlpha = particle.life;
            this.ctx.fillStyle = particle.color;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fill();
        });
        this.ctx.globalAlpha = 1;
    }

    renderLoop() {
        if (!this.activeGame) return this.gameOver();
        this.update();
        this.draw();
    }

    startIdleAnimation() {
        const idleLoop = () => {
            if (this.gameState !== 'title') return;
            
            this.birdY = this.frameHeight / 2 + Math.sin(Date.now() / 500) * 20;
            
            this.ctx.clearRect(0, 0, this.frameWidth, this.frameHeight);
            
            if (this.images.bird.complete) {
                this.ctx.drawImage(
                    this.images.bird,
                    this.birdX,
                    this.birdY,
                    this.birdWidth,
                    this.birdHeight
                );
            }
            
            if (this.images.ground.complete) {
                this.ctx.drawImage(
                    this.images.ground,
                    0,
                    this.frameHeight - this.groundHeight,
                    this.frameWidth,
                    this.groundHeight * 2
                );
            }
            
            requestAnimationFrame(idleLoop);
        };
        
        requestAnimationFrame(idleLoop);
    }

    createParticles(x, y, count) {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 5,
                vy: (Math.random() - 0.5) * 5 - 2,
                life: 1.0,
                size: Math.random() * 4 + 2,
                color: `hsl(${Math.random() * 60 + 160}, 70%, 60%)`
            });
        }
    }

    createStarBurst(x, y, count) {
        // Create star burst effect with clean lines
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count;
            const speed = 6 + Math.random() * 3;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1.0,
                size: 3,
                color: '#FFE66D', 
                isStarBurst: true
            });
        }
    }

    showPlusOne(x, y) {
        // Create DOM element for +1 text
        const plusOneEl = document.createElement('div');
        plusOneEl.className = 'plus-one-text';
        plusOneEl.textContent = '+1';
        plusOneEl.style.left = `${x}px`;
        plusOneEl.style.top = `${y}px`;
        
        const container = document.getElementById('ui-overlay');
        if (container) {
            container.appendChild(plusOneEl);
            
            // Remove element after animation
            setTimeout(() => {
                plusOneEl.remove();
            }, 800);
        }
    }

    createExplosion(x, y, count) {
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * 8,
                vy: Math.sin(angle) * 8,
                life: 1.0,
                size: Math.random() * 6 + 3,
                color: `hsl(${Math.random() * 40}, 80%, 60%)`
            });
        }
    }

    updateParticles() {
        this.particles = this.particles.filter(particle => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            
            // Star burst particles fade out smoothly
            if (particle.isStarBurst) {
                particle.vx *= 0.95; // Slow down
                particle.vy *= 0.95;
                particle.life -= 0.03;
            } else {
                particle.vy += 0.2;
                particle.life -= 0.02;
            }
            
            return particle.life > 0;
        });
    }

    loadAssets() {
        const assetList = {
            bird: 'img/bird.png',
            ground: 'img/ground.png',
            pipeTop: 'img/pipe_top.png',
            pipeBottom: 'img/pipe_bottom.png'
        };

        let loadedCount = 0;
        const totalAssets = Object.keys(assetList).length;

        Object.entries(assetList).forEach(([key, src]) => {
            const img = new Image();
            img.onload = () => {
                loadedCount++;
                if (loadedCount === totalAssets) {
                    this.assetsLoaded = true;
                    this.startIdleAnimation();
                }
            };
            img.onerror = () => {
                console.error(`Failed to load image: ${src}`);
                loadedCount++;
                if (loadedCount === totalAssets) {
                    this.assetsLoaded = true;
                    this.startIdleAnimation();
                }
            };
            img.src = src;
            this.images[key] = img;
        });
    }
}

// Initialize game when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.game = new Game();
    });
} else {
    window.game = new Game();
}