const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

// Make orb MUCH more visible
const newHtml = html
    .replace('for (let i = 0; i < 100; i++)', 'for (let i = 0; i < 300; i++)')
    .replace('size: 1 + Math.random() * 2', 'size: 3 + Math.random() * 4')
    .replace('opacity: 0.3 + Math.random() * 0.7', 'opacity: 0.7 + Math.random() * 0.3')
    .replace('ctx.fillStyle = `rgba(0, 217, 255, ${particle.opacity * (0.5 + Math.sin(particle.phase) * 0.5)})`', 
             'ctx.fillStyle = `rgba(0, 217, 255, ${particle.opacity})`')
    .replace('ctx.strokeStyle = `rgba(0, 217, 255, ${0.1 * (1 - distance / 100)})`', 
             'ctx.strokeStyle = `rgba(0, 217, 255, ${0.4 * (1 - distance / 100)})`')
    .replace('ctx.lineWidth = 0.5', 'ctx.lineWidth = 1.5')
    .replace("gradient.addColorStop(0, 'rgba(0, 217, 255, 0.1)')", 
             "gradient.addColorStop(0, 'rgba(0, 217, 255, 0.4)')")
    .replace("gradient.addColorStop(0.5, 'rgba(0, 217, 255, 0.05)')", 
             "gradient.addColorStop(0.5, 'rgba(0, 217, 255, 0.2)')");

fs.writeFileSync('index.html', newHtml);
console.log('✅ Made orb WAY more visible!');
