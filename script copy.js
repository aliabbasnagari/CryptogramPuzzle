const regex = /^[A-Z]$/;
var testidx = 0;
var history = ["", ""];
var revealed = false;
let stopwatchInterval;
let elapsedTime = 0;

var ORIGINAL_QUOTE = [];
var DECRYPTED_QUOTE = [];
var ENCRYPTED_QUOTE = [];
var ENCRYPTED_QUOTE_CHARS = [];
var CURR_SELECTED = "";
var SUBSTITUTION_MAP = {};

function startStopwatch(stopwatchDisplay) {
	if (stopwatchInterval) return; // Prevent multiple intervals from being created

	stopwatchInterval = setInterval(() => {
		elapsedTime++;
		updateStopwatchDisplay(stopwatchDisplay);
	}, 1000);
}

function stopStopwatch() {
	clearInterval(stopwatchInterval);
	stopwatchInterval = null; // Reset the interval ID
}

function resetStopwatch(stopwatchDisplay) {
	clearInterval(stopwatchInterval);
	stopwatchInterval = null;
	elapsedTime = 0;
	stopwatchDisplay.textContent = '0:00:00';
}

function updateStopwatchDisplay(stopwatchDisplay) {
	const hours = Math.floor(elapsedTime / 3600);
	const minutes = Math.floor((elapsedTime % 3600) / 60);
	const seconds = elapsedTime % 60;
	stopwatchDisplay.textContent = `${hours}:${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

function drawQuote(quote, container, stopwatchDisplay) {
	revealed = false;
	CURR_SELECTED = "";
	quote = quote.toUpperCase();
	ORIGINAL_QUOTE = quote.split("");
	ENCRYPTED_QUOTE_CHARS = encryptQuote(quote, SUBSTITUTION_MAP);
	let encrypted_quote = ENCRYPTED_QUOTE_CHARS.split(" ");
	for (let i = 0; i < encrypted_quote.length; i++) {
		encrypted_quote[i] = encrypted_quote[i].split("");
	}
	ENCRYPTED_QUOTE_CHARS = ENCRYPTED_QUOTE_CHARS.split("");
	ENCRYPTED_QUOTE = [...new Set(ENCRYPTED_QUOTE_CHARS)].filter(char => /^[A-Z]$/.test(char));
	DECRYPTED_QUOTE = ENCRYPTED_QUOTE_CHARS.map(char => { return /[A-Z]/.test(char) ? '' : char; });

	var fargment = document.createDocumentFragment();

	let index = 0;
	encrypted_quote.forEach((word) => {
		var wordcontainer = document.createElement("div");
		wordcontainer.classList.add("word-container");
		word.forEach((char) => {
			let valid = regex.test(char);
			let guessLetter = document.createElement("span");
			guessLetter.classList.add("guess-letter");
			let cryptLetter = document.createElement("span");
			cryptLetter.classList.add("crypt-letter");

			if (valid) {
				guessLetter.innerHTML = "&nbsp;";
			}
			cryptLetter.innerHTML = char;

			let charBox = document.createElement("div");
			charBox.classList.add("character-box");
			charBox.data = char;
			charBox.index = index;

			charBox.appendChild(guessLetter);
			if (valid) {
				let sep = document.createElement("div");
				sep.classList.add("dotted-line");
				charBox.appendChild(sep);
			}
			charBox.appendChild(cryptLetter);

			if (valid) {
				charBox.addEventListener("click", function (e) {
					Activate(e.currentTarget.data, container);
				});
			} else {
				charBox.className = "character-box-special";
			}
			wordcontainer.appendChild(charBox);
			index++;
		});
		fargment.appendChild(wordcontainer);
		index++;
	});
	container.replaceChildren(fargment);
	resetStopwatch(stopwatchDisplay);
	startStopwatch(stopwatchDisplay);
}

function Activate(letter, container) {
	CURR_SELECTED = letter;
	container.querySelectorAll(".character-box").forEach((box) => {
		if (box.querySelector(".crypt-letter").innerHTML === letter) {
			box.classList.add("active");
		} else {
			box.classList.remove("active");
		}
	});
}

function encryptQuote(text, substitutionMap) {
	const result = [];
	for (let i = 0; i < text.length; i++) {
		const char = text[i].toUpperCase();
		if (char >= "A" && char <= "Z") {
			result.push(substitutionMap[char]);
		} else {
			result.push(char);
		}
	}
	return result.join("");
}

function generateSubstitutionMap() {
	const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
	const shuffledAlphabet = shuffleArray(alphabet.slice());
	const map = {};
	for (let i = 0; i < alphabet.length; i++) {
		map[alphabet[i]] = shuffledAlphabet[i];
	}
	return map;
}

function shuffleArray(array) {
	for (let i = array.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[array[i], array[j]] = [array[j], array[i]];
	}
	return array;
}

async function fetchRandomQuotebkp() {
	let index = Math.floor(Math.random() * 2508);
	testidx = index;
	try {
		const response = await fetch(
			`https://datasets-server.huggingface.co/rows?dataset=Abirate%2Fenglish_quotes&config=default&split=train&offset=${index}&length=1`
		);
		if (!response.ok) {
			throw new Error("Network response was not ok " + response.statusText);
		}

		const data = await response.json();
		const firstRow = data.rows[0].row;
		let quote = firstRow.quote;
		let author = firstRow.author;
		let tags = firstRow.tags.slice(0, 3).join(", ");

		const replacements = {
			"â€œ": "“",
			"â€�": "”",
			"â€™": "’",
			"â€“": "–",
			"â€": "—",
			"Ã©": "é",
		};

		quote = quote.replace(
			/â€œ|â€�|â€™|â€“|â€|Ã©/g,
			(match) => replacements[match]
		);

		console.log("Quote:", quote);
		console.log("Author:", author);
		console.log("Top 3 Tags:", tags);

		// 		document.getElementById("quote").innerHTML = `
		// <p><strong>Quote:</strong> ${quote}</p>
		// <p><strong>Author:</strong> ${author}</p>
		// <p><strong>Top 3 Tags:</strong> ${tags}</p>`;

		return { quote, author, tags };
	} catch (error) {
		console.error("Error fetching data:", error);
		return null;
	}
}

async function fetchRandomQuote() {
	let quote, author, tags;
	let attempts = 0;

	do {
		let index = Math.floor(Math.random() * 2508);
		try {
			const response = await fetch(
				`https://datasets-server.huggingface.co/rows?dataset=Abirate%2Fenglish_quotes&config=default&split=train&offset=${index}&length=1`
			);

			if (!response.ok) {
				throw new Error("Network response was not ok " + response.statusText);
			}

			const data = await response.json();
			const firstRow = data.rows[0].row;
			quote = firstRow.quote;
			author = firstRow.author;
			tags = firstRow.tags.slice(0, 3).join(", ");

			const replacements = {
				"â€œ": "“",
				"â€�": "”",
				"â€™": "’",
				"â€“": "–",
				"â€": "—",
				"Ã©": "é",
			};

			quote = quote.replace(
				/â€œ|â€�|â€™|â€“|â€|Ã©/g,
				(match) => replacements[match]
			);

			console.log("Quote:", quote);
			console.log("Author:", author);
			console.log("Top 3 Tags:", tags);

			// document.getElementById("quote").innerHTML = `
			// <p><strong>Quote:</strong> ${quote}</p>
			// <p><strong>Author:</strong> ${author}</p>
			// <p><strong>Top 3 Tags:</strong> ${tags}</p>`;

			attempts++;
		} catch (error) {
			console.error("Error fetching data:", error);
			return null;
		}
	} while (quote.length > 100 && attempts < 10); // Limit attempts to prevent infinite loop
	return { quote, author, tags };
}

function updateCharacter(original, character, container) {
	character = character.toUpperCase();
	container.querySelectorAll(".character-box").forEach((box) => {
		let selected = box.querySelector(".guess-letter");
		if (box.querySelector(".crypt-letter").innerHTML === original) {
			DECRYPTED_QUOTE[box.index] = character;
			history[0] = selected.innerHTML;
			history[1] = character;
			selected.innerHTML = character;
		}
	});

	if (arraysEqual(DECRYPTED_QUOTE, ORIGINAL_QUOTE) && !revealed) {
		console.log("WON");
		let title = popup.querySelector('h2');
		let message = popup.querySelector('p');
		title.innerHTML = "🎉 Nice Going!";
		message.innerHTML = "Congrats, you have complete the puzzle in " + stopwatchDisplay.textContent;
		popup.style.display = 'block';
		stopStopwatch();
		resetStopwatch();
	} else {
		Activate(ENCRYPTED_QUOTE[(ENCRYPTED_QUOTE.indexOf(CURR_SELECTED) + 1) % ENCRYPTED_QUOTE.length]);
	}
}

function arraysEqual(arr1, arr2) {
	return arr1.length === arr2.length && arr1.every((element, index) => element === arr2[index]);
}

// Menu Options
function startNewGame(container, stopwatchDisplay) {
	container.scrollIntoView({ behavior: 'smooth' });
	stopStopwatch();
	SUBSTITUTION_MAP = generateSubstitutionMap();
	container.replaceChildren();
	let marea = document.getElementById('message');
	marea.innerHTML = "Loading Quote...";
	fetchRandomQuote().then((response) => {
		if (response) {
			console.log("Quote loaded.....", testidx, response);
			drawQuote(response.quote + ' -(' + response.author + ')', container, stopwatchDisplay);
			//drawQuote("Ali Abbas");
			marea.innerHTML = "";
		} else {
			console.log("Failed to load quote.....");
			marea.innerHTML = "Failed to Load Quote...";
		}
	});
}

function undoLatestMove(container) {
	container.querySelectorAll(".guess-letter").forEach((box) => {
		if (history[1] != "" && box.innerHTML === history[1]) {
			box.innerHTML = history[0];
		}
	});
	history[0] = "";
	history[1] = "";
}

function giveHint() {
	const emptyIndices = DECRYPTED_QUOTE.map((item, index) => (item === '' ? index : -1))
		.filter(index => index !== -1);

	const idx = emptyIndices.length > 0
		? emptyIndices[Math.floor(Math.random() * emptyIndices.length)]
		: -1;
	if (idx == -1) return;

	Activate(ENCRYPTED_QUOTE_CHARS[idx], container);
	updateCharacter(ENCRYPTED_QUOTE_CHARS[idx], ORIGINAL_QUOTE[idx]);
}

function revealGame(container) {
	revealed = true;
	DECRYPTED_QUOTE.forEach((char, idx) => {
		console.log(char, idx);
		if (char === '') {
			Activate(ENCRYPTED_QUOTE_CHARS[idx], container);
			updateCharacter(ENCRYPTED_QUOTE_CHARS[idx], ORIGINAL_QUOTE[idx], container);
		}
	});
}


document.addEventListener('DOMContentLoaded', function () {
	// Menu Buttons
	const startBtn = document.getElementById('btnStart');
	const undoBtn = document.getElementById('btnUndo');
	const resetBtn = document.getElementById('btnReset');
	const hintBtn = document.getElementById('btnHint');
	const revealBtn = document.getElementById('btnReveal');

	const popup = document.getElementById('popup');
	const closeBtn = document.querySelector('.close-btn');

	var container = document.getElementById("cryptoContainer");
	var vkeyboard = document.getElementById('customKeyboard');
	const stopwatchDisplay = document.getElementById('stopwatch');
	const buttons = vkeyboard.querySelectorAll('button');
	buttons.forEach(button => {
		button.addEventListener('click', () => {
			if (CURR_SELECTED != "")
				updateCharacter(CURR_SELECTED, button.textContent, container);
			console.log(`Button ${button.textContent} clicked`);
		});
	});

	startBtn.onclick = () => { startNewGame(container, stopwatchDisplay); }
	undoBtn.onclick = () => { undoLatestMove(container); }
	resetBtn.onclick = () => { drawQuote(ORIGINAL_QUOTE.join(""), container, stopwatchDisplay); }
	hintBtn.onclick = () => { giveHint(); }
	revealBtn.onclick = () => { revealGame(container); }

	closeBtn.onclick = function () {
		popup.style.display = 'none';
	}
	window.onclick = function (event) {
		if (event.target === popup)
			popup.style.display = 'none';
	}

	document.addEventListener("keydown", function keyHandler(event) {
		if (event.key === 'Tab') {
			if (CURR_SELECTED === "") Activate(ENCRYPTED_QUOTE[0], container);
			else
				Activate(ENCRYPTED_QUOTE[(ENCRYPTED_QUOTE.indexOf(CURR_SELECTED) + 1) % ENCRYPTED_QUOTE.length], container);
		} else if (event.key.length === 1 && regex.test(event.key.toUpperCase())) {
			updateCharacter(CURR_SELECTED, event.key, container);
		}
	});
});