        
        // HUD Rings Animation
        const hudCanvas = document.getElementById('hud-canvas');
        const hudCtx = hudCanvas.getContext('2d');
        let hudAngle = 0;
        
        function initHUD() {
            hudCanvas.width = 800;
            hudCanvas.height = 800;
            animateHUD();
        }
        
        function animateHUD() {
            hudCtx.clearRect(0, 0, hudCanvas.width, hudCanvas.height);
            const cx = hudCanvas.width / 2;
            const cy = hudCanvas.height / 2;
            
            // Rotating outer ring
            hudCtx.save();
            hudCtx.translate(cx, cy);
            hudCtx.rotate(hudAngle);
            hudCtx.beginPath();
            hudCtx.arc(0, 0, 200, 0, Math.PI * 1.5);
            hudCtx.strokeStyle = 'rgba(0, 217, 255, 0.4)';
            hudCtx.lineWidth = 2;
            hudCtx.stroke();
            hudCtx.restore();
            
            // Counter-rotating middle ring
            hudCtx.save();
            hudCtx.translate(cx, cy);
            hudCtx.rotate(-hudAngle * 0.7);
            hudCtx.beginPath();
            hudCtx.arc(0, 0, 170, Math.PI * 0.2, Math.PI * 1.8);
            hudCtx.strokeStyle = 'rgba(0, 217, 255, 0.3)';
            hudCtx.lineWidth = 1.5;
            hudCtx.stroke();
            hudCtx.restore();
            
            // Scanning arc
            hudCtx.save();
            hudCtx.translate(cx, cy);
            hudCtx.rotate(hudAngle * 2);
            const grad = hudCtx.createRadialGradient(0, 0, 150, 0, 0, 190);
            grad.addColorStop(0, 'transparent');
            grad.addColorStop(0.8, 'rgba(0, 217, 255, 0.3)');
            grad.addColorStop(1, 'rgba(0, 217, 255, 0)');
            hudCtx.fillStyle = grad;
            hudCtx.beginPath();
            hudCtx.moveTo(0, 0);
            hudCtx.arc(0, 0, 190, 0, Math.PI * 0.3);
            hudCtx.closePath();
            hudCtx.fill();
            hudCtx.restore();
            
            // Corner brackets
            drawBracket(cx - 180, cy - 180, 30, 1);
            drawBracket(cx + 180, cy - 180, 30, 2);
            drawBracket(cx - 180, cy + 180, 30, 3);
            drawBracket(cx + 180, cy + 180, 30, 4);
            
            hudAngle += 0.01;
            requestAnimationFrame(animateHUD);
        }
        
        function drawBracket(x, y, size, corner) {
            hudCtx.strokeStyle = 'rgba(0, 217, 255, 0.5)';
            hudCtx.lineWidth = 2;
            hudCtx.beginPath();
            if (corner === 1) {
                hudCtx.moveTo(x, y + size);
                hudCtx.lineTo(x, y);
                hudCtx.lineTo(x + size, y);
            } else if (corner === 2) {
                hudCtx.moveTo(x - size, y);
                hudCtx.lineTo(x, y);
                hudCtx.lineTo(x, y + size);
            } else if (corner === 3) {
                hudCtx.moveTo(x, y - size);
                hudCtx.lineTo(x, y);
                hudCtx.lineTo(x + size, y);
            } else {
                hudCtx.moveTo(x - size, y);
                hudCtx.lineTo(x, y);
                hudCtx.lineTo(x, y - size);
            }
            hudCtx.stroke();
        }
