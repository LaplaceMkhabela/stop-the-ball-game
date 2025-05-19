const movingObject = document.getElementById('movingObject');
        const targetZone = document.getElementById('targetZone');
        const stopButton = document.getElementById('stopButton');
        const resetButton = document.getElementById('resetButton');
        const scoreDisplay = document.getElementById('scoreDisplay');
        const speedDisplay = document.getElementById('speedDisplay');
        const message = document.getElementById('message');
        
        // Game settings
        const INITIAL_SPEED = 5;
        const MAX_SPEED = 15;
        const SPEED_INCREMENT = 0.5;
        
        let score = 0;
        let speed = INITIAL_SPEED;
        let position = 0;
        let gameRunning = true;
        let animationId;
        let shouldIncreaseSpeed = false;
        
        // Get target zone position
        const targetRect = targetZone.getBoundingClientRect();
        const containerRect = document.getElementById('gameContainer').getBoundingClientRect();
        
        const targetLeft = targetRect.left - containerRect.left;
        const targetRight = targetRect.right - containerRect.left;
        
        function moveObject() {
            position += speed;
            movingObject.style.left = position + 'px';
            
            // Reset position if object goes off screen
            if (position > 600) {
                position = -40;
                
                // Visual feedback when reaching max speed
                if (speed >= MAX_SPEED) {
                    movingObject.classList.add('max-speed');
                    speedDisplay.textContent = "Speed: MAX!";
                    speedDisplay.style.color = "#e74c3c";
                }
            }
            
            animationId = requestAnimationFrame(moveObject);
        }
        
        function stopObject() {
            if (!gameRunning) return;
            
            gameRunning = false;
            cancelAnimationFrame(animationId);
            
            // Check if object is in target zone
            const objectRight = position + 40;
            let scored = false;
            
            if (position >= targetLeft && objectRight <= targetRight) {
                score += 10;
                message.textContent = "Perfect! +10 points";
                message.style.color = "#2ecc71";
                scored = true;
                shouldIncreaseSpeed = true;

                    // Only increase speed if player scored last round
                if (shouldIncreaseSpeed && speed < MAX_SPEED) {
                    speed += SPEED_INCREMENT;
                    speedDisplay.textContent = "Speed: " + speed.toFixed(1);
                    shouldIncreaseSpeed = false; // Reset flag
                }
            } 
            else if ((position >= targetLeft && position <= targetRight) || 
                     (objectRight >= targetLeft && objectRight <= targetRight)) {
                score += 5;
                message.textContent = "Partial! +5 points";
                message.style.color = "#f39c12";
                scored = true;
                shouldIncreaseSpeed = true;

                    // Only increase speed if player scored last round
                if (shouldIncreaseSpeed && speed < MAX_SPEED) {
                    speed += SPEED_INCREMENT;
                    speedDisplay.textContent = "Speed: " + speed.toFixed(1);
                    shouldIncreaseSpeed = false; // Reset flag
                }
            }
            else {
                message.textContent = "Missed! Try again";
                message.style.color = "#e74c3c";
            }
            
            // Only increase speed next round if player scored this round
            shouldIncreaseSpeed = scored;
            
            scoreDisplay.textContent = "Score: " + score;
            
            // Reset after a delay
            setTimeout(resetGame, 1500);
        }
        
        function resetGame() {
            position = 0;
            movingObject.style.left = position + 'px';
            message.textContent = "";
            gameRunning = true;
            moveObject();
        }
        
        function fullReset() {
            // Cancel any ongoing animation
            cancelAnimationFrame(animationId);
            
            // Reset all game variables
            score = 0;
            speed = INITIAL_SPEED;
            position = 0;
            gameRunning = true;
            shouldIncreaseSpeed = false;
            
            // Reset visual effects
            movingObject.classList.remove('max-speed');
            speedDisplay.textContent = "Speed: " + speed;
            speedDisplay.style.color = "#7f8c8d";
            
            // Update display
            scoreDisplay.textContent = "Score: 0";
            message.textContent = "Game reset!";
            message.style.color = "#3498db";
            movingObject.style.left = position + 'px';
            
            // Start new game
            setTimeout(() => {
                message.textContent = "";
                moveObject();
            }, 1000);
        }
        
        stopButton.addEventListener('click', stopObject);
        resetButton.addEventListener('click', fullReset);
        
        // Start the game
        moveObject();
