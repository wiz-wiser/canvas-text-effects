window.addEventListener("load", function () {
	const canvas = document.getElementById("canvas1");
	const ctx = canvas.getContext("2d", {
		willReadFrequently: true,
	});
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;

	class Particle {
		constructor(effect, x, y, color) {
			this.effect = effect;
			this.x = Math.random() * this.effect.canvasWidth;
			this.y = this.effect.canvasHeight;
			this.color = color;
			this.originX = x;
			this.originY = y;
			this.size = this.effect.gap / 3;
			this.dx = 0;
			this.dy = 0;
			this.vx = 0;
			this.vy = 0;
			this.force = 0;
			this.angle = 0;
			this.distance = 0;
			this.friction = Math.random() * 0.6 + 0.15;
			this.ease = Math.random() * 0.1 + 0.005;
		}
		draw() {
			this.effect.context.fillStyle = this.color;
			this.effect.context.fillRect(this.x, this.y, this.size, this.size);
		}
		update() {
			this.dx = this.effect.mouse.x - this.x;
			this.dy = this.effect.mouse.y - this.y;
			this.distance = this.dx * this.dx + this.dy * this.dy;
			this.force = -this.effect.mouse.radius / this.distance;

			if (this.distance < this.effect.mouse.radius) {
				this.angle = Math.atan2(this.dy, this.dx);
				this.vx += this.force * Math.cos(this.angle);
				this.vy += this.force * Math.sin(this.angle);
			}

			this.x +=
				(this.vx *= this.friction) + (this.originX - this.x) * this.ease;
			this.y +=
				(this.vy *= this.friction) + (this.originY - this.y) * this.ease;
		}
	}

	class Effect {
		constructor(context, canvasWidth, canvasHeight) {
			this.context = context;
			this.canvasWidth = canvasWidth;
			this.canvasHeight = canvasHeight;
			this.textX = this.canvasWidth / 2;
			this.textY = this.canvasHeight / 2;
			this.fontSize = 800;
			this.lineHeight = this.fontSize * 1.1;
			this.maxTextWidth = this.canvasWidth * 0.8;
			this.textInput = document.getElementById("textInput");
			this.verticalOffset = 0;
			this.textInput.addEventListener("keyup", (e) => {
				if (e.key !== " ") {
					this.context.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
					this.wrapText(e.target.value);
				}
			});
			// particle text
			this.particles = [];
			this.gap = 15;
			this.mouse = {
				radius: 20000,
				x: 0,
				y: 0,
			};
			window.addEventListener("mousemove", (e) => {
				this.mouse.x = e.x;
				this.mouse.y = e.y;
			});
		}
		wrapText(text) {
			// canvas settings
			const gradient = this.context.createLinearGradient(
				0,
				0,
				this.canvasWidth,
				this.canvasHeight
			);
			gradient.addColorStop(0.2, "#5031AA");
			gradient.addColorStop(0.5, "#8F53E8");
			gradient.addColorStop(0.8, "#C9A5FF");
			this.context.fillStyle = gradient;
			this.context.textAlign = "center";
			this.context.textBaseline = "middle";
			this.context.lineWidth = 2;
			this.context.strokeStyle = gradient;
			this.context.font = this.fontSize + "px Barlow";
			// break multiline text
			let linesArray = [];
			let words = text.split(" ");
			let lineCounter = 0;
			let line = "";
			for (let i = 0; i < words.length; i++) {
				let testLine = line + words[i] + " ";
				if (this.context.measureText(testLine).width > this.maxTextWidth) {
					line = words[i] + " ";
					lineCounter++;
				} else {
					line = testLine;
				}
				linesArray[lineCounter] = line;
			}
			let textHeight = this.lineHeight * lineCounter;
			this.textY = this.canvasHeight / 2 - textHeight / 2 + this.verticalOffset;
			linesArray.forEach((el, index) => {
				this.context.fillText(
					el,
					this.textX,
					this.textY + index * this.lineHeight
				);
				//this.context.strokeText(el, this.textX, this.textY + (index * this.lineHeight));
			});
			this.convertToParticles();
		}
		convertToParticles() {
			this.particles = [];
			const pixels = this.context.getImageData(
				0,
				0,
				this.canvasWidth,
				this.canvasHeight
			).data;
			this.context.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
			for (let y = 0; y < this.canvasHeight; y += this.gap) {
				for (let x = 0; x < this.canvasWidth; x += this.gap) {
					const index = (y * this.canvasWidth + x) * 4;
					const alpha = pixels[index + 3];
					if (alpha > 0) {
						const red = pixels[index];
						const green = pixels[index + 1];
						const blue = pixels[index + 2];
						const color = "rgb(" + red + "," + green + "," + blue + ")";
						this.particles.push(new Particle(this, x, y, color));
					}
				}
			}
		}
		constellations() {
			const position = this.particles[0].size / 2;
			for (let a = 0; a < this.particles.length; a++) {
				for (let b = a; b < this.particles.length; b++) {
					const dx = this.particles[a].x - this.particles[b].x;
					const dy = this.particles[a].y - this.particles[b].y;
					const distance = Math.hypot(dy, dx);
					const connectDistance = this.gap * 2.1;
					if (distance < connectDistance) {
						const opacity = 1 - distance / connectDistance;
						this.context.beginPath();
						this.context.moveTo(
							this.particles[a].x + position,
							this.particles[a].y + position
						);
						this.context.lineTo(
							this.particles[b].x + position,
							this.particles[b].y + position
						);
						this.context.save();
						this.context.globalAlpha = opacity;
						this.context.stroke();
						this.context.restore();
					}
				}
			}
		}
		render() {
			this.particles.forEach((particle) => {
				particle.update();
				particle.draw();
			});
			this.constellations();
		}
		resize(width, height) {
			this.canvasWidth = width;
			this.canvasHeight = height;
			this.textX = this.canvasWidth / 2;
			this.textY = this.canvasHeight / 2;
			this.maxTextWidth = this.canvasWidth * 0.8;
		}
	}

	const effect = new Effect(ctx, canvas.width, canvas.height);
	effect.wrapText(effect.textInput.value);
	effect.render();

	function animate() {
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		effect.render();
		requestAnimationFrame(animate);
	}
	animate();

	window.addEventListener("resize", function () {
		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;
		effect.resize(canvas.width, canvas.height);
		effect.wrapText(effect.textInput.value);
		console.log("resize");
	});
});
