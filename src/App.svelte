<script>
	let data = {
		'tomato' : {
			'question': '{{keyAmount}} {{keyUnit}} {{name}} costs {{valueAmount}} {{valueUnit}}.',
			'answer': 'It costs {{valueAmount}} {{valueUnit}}!',
			'name': 'tomato',
			'valueType': 'currency',
			'valueAmount': 20,
			'valueUnit': 'rupees',
			'keyType': 'weight',
			'keyAmount': 1,
			'keyUnit': 'kg'
		}, 'million-to-lakhs' : {
			'question': '{{keyAmount}} {{keyUnit}} is {{valueAmount}} {{valueUnit}}.',
			'answer': 'It\'s {{valueAmount}} {{valueUnit}}!',
			'valueType': 'currency',
			'valueAmount': 10,
			'valueUnit': 'lakhs',
			'keyType': 'currency',
			'keyAmount': 1,
			'keyUnit': 'million'
		}
	}

	let allQuestions = Object.keys(data);

	let currentQuestion;
	let currentQuestionData;
	let enteredAmount = 0;

	
	let result = '';
	let error = '';
	let nextQuestionMsg = '';
	function clearMessages() {
		result = '';
		error = '';
		nextQuestionMsg = '';
	}
	function clearInput() {
		enteredAmount = '';
	}

	function setRandomQuestion() {
		clearMessages();
		clearInput();
		let randomQuestion = allQuestions[Math.floor(Math.random() * allQuestions.length)];
		currentQuestion = randomQuestion;
		currentQuestionData = data[currentQuestion];
		console.log(currentQuestion);
	}
	setRandomQuestion();

	const handleKeydown = e => {
		if (e.key === 'Enter') {
			submit();
			return;
		}
	};


	function submit() {
		clearMessages();
		let millisToNextQuestion = 5000;
		if (isNaN(enteredAmount)) {
			error = `${enteredAmount} is not a number.`;
			setTimeout(() => {
				error = '';
			}, millisToNextQuestion);
			return;
		}

		//Improve messages later
		if (enteredAmount == currentQuestionData.valueAmount) {
			result = '✔️';
		} else {
			let answerText = currentQuestionData.answer
				.replace('{{valueAmount}}', currentQuestionData.valueAmount)
				.replace('{{valueUnit}}', currentQuestionData.valueUnit);
			result = '❌ ' + answerText;
		}
		setTimeout(() => {
			result = '';
		}, millisToNextQuestion);

		//Next question
		let secondsRemainingForNextQuestion = millisToNextQuestion / 1000;

		let interval = setInterval(() => {
			secondsRemainingForNextQuestion--;
			nextQuestionMsg = `Navigating to next question in ${secondsRemainingForNextQuestion} seconds.`;

			if(secondsRemainingForNextQuestion <= 0){
				nextQuestionMsg = '';
				setRandomQuestion();
				console.log('Changed');
				clearInterval(interval);
			}
		}, 1000);

		console.log(enteredAmount);
	}

	window.onload = setEventListeners;

	function setEventListeners() {
		document.getElementById('value-amount').addEventListener('input', function (evt) {
			enteredAmount = this.value;
		});
	}
</script>

<svelte:window on:keydown={handleKeydown}/>

<main>
	{@html currentQuestionData.question
		.replace('{{keyAmount}}', currentQuestionData.keyAmount)
		.replace('{{keyUnit}}', currentQuestionData.keyUnit)
		.replace('{{name}}', currentQuestionData.name)
		.replace('{{valueAmount}}', '<input id="value-amount" autofocus/>')
		.replace('{{valueUnit}}', currentQuestionData.valueUnit)
	}

	<div class="result">{result}</div>
	<div class="error">{error}</div>
	<div class="nextQuestionMsg">{nextQuestionMsg}</div>
</main>

<style>
	main {
		text-align: center;
		padding: 1em;
		max-width: 240px;
		margin: 0 auto;
		display: inline;
	}
	.result {
		color: black;
	}
	.error {
		color: red;
	}
	.nextQuestionMsg {
		color: gray;
	}

</style>