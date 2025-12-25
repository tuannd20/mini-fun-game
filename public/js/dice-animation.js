// Dice animation utility
let diceAnimationInterval = null;

function startDiceAnimation() {
	const symbols = ["reindeer", "potion", "shrimp", "crab", "fish", "chicken"];
	const images = {
		reindeer: "/christmas-img/christmas-reindeer.png",
		potion: "/christmas-img/christmas-potion.png",
		shrimp: "/christmas-img/christmas-shrimp.png",
		crab: "/christmas-img/christmas-crab.png",
		fish: "/christmas-img/christmas-fish.png",
		chicken: "/christmas-img/christmas-chicken.png",
	};

	let animationCount = 0;
	const maxAnimations = 20; // Number of animation cycles

	// Create or get dice display element
	let diceDisplay = document.getElementById("dice-animation");
	if (!diceDisplay) {
		diceDisplay = document.createElement("div");
		diceDisplay.id = "dice-animation";
		diceDisplay.className = "fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50";
		diceDisplay.innerHTML = '<div class="text-center"></div>';
		document.body.appendChild(diceDisplay);
	}

	const diceContent = diceDisplay.querySelector("div");

	diceAnimationInterval = setInterval(() => {
		// Show random symbols
		const randomSymbols = [];
		for (let i = 0; i < 3; i++) {
			const randomSymbol = symbols[Math.floor(Math.random() * symbols.length)];
			randomSymbols.push(randomSymbol);
		}

		diceContent.innerHTML = `
      <div class="text-white text-4xl mb-4">Rolling dice...</div>
      <div class="flex space-x-8">
        ${randomSymbols
					.map(
						(symbol) =>
							`<img src="${images[symbol]}" alt="${symbol}" class="w-5 h-5 animate-bounce object-contain" style="image-rendering: auto;">`
					)
					.join("")}
      </div>
    `;

		animationCount++;

		if (animationCount >= maxAnimations) {
			clearInterval(diceAnimationInterval);
			// Hide animation after a short delay
			setTimeout(() => {
				if (diceDisplay && diceDisplay.parentNode) {
					diceDisplay.remove();
				}
			}, 500);
		}
	}, 100);
}

// Stop dice animation
function stopDiceAnimation() {
	if (diceAnimationInterval) {
		clearInterval(diceAnimationInterval);
		diceAnimationInterval = null;
	}

	const diceDisplay = document.getElementById("dice-animation");
	if (diceDisplay && diceDisplay.parentNode) {
		diceDisplay.remove();
	}
}
