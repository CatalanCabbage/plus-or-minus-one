<script>
	import { data } from "./questions";

	let allQuestions = Object.keys(data);
	let completedQuestions = {};
	if (localStorage.getItem("completedQuestions")) {
		completedQuestions = JSON.parse(localStorage.getItem("completedQuestions"));
	}
	//Remove already answered questions
	allQuestions = allQuestions.filter((question) => {return completedQuestions[question] == null});
	console.log('Remaining questions: ' + allQuestions);

	function markQuestionCompleted(question) {
		delete allQuestions[question];
		completedQuestions[question] = Date.now();
		localStorage.setItem("completedQuestions", JSON.stringify(completedQuestions));
	}

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
		console.log('Remaining questions: ' + allQuestions);
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

	let scores = {
		'WRONG' : 0,
		'CLOSE_ENOUGH' : 1,
		'CORRECT' : 2
	}
	function getScore(answer, input, tolerance) {
		let closeEnoughFactor = 0.4; //For a tolerance of 100, +-40 says "right" and remaining says "close enough". 
		if ((answer - (closeEnoughFactor * tolerance) < input) && (answer + (closeEnoughFactor * tolerance) > input)) {
			console.log(`Input ${input} is ${answer} +- ${closeEnoughFactor * tolerance}`);
			return scores.CORRECT;
		} else if ((answer - tolerance < input) && (answer + tolerance > input)) {
			console.log(`Input ${input} is ${answer} +- ${tolerance} but not +- ${closeEnoughFactor * tolerance}`);
			return scores.CLOSE_ENOUGH;
		} else {
			return scores.WRONG;
		}
	}
	function submit() {
		clearMessages();
		let millisToNextQuestion = 5000;
		if (!enteredAmount) {
			error = `Enter a number. Any number!`;
			setTimeout(() => {
				error = '';
			}, millisToNextQuestion);
			return;
		}
		if (isNaN(enteredAmount)) {
			error = `${enteredAmount} is not a number.`;
			setTimeout(() => {
				error = '';
			}, millisToNextQuestion);
			return;
		}

		let score = getScore(currentQuestionData.value.amount, enteredAmount, currentQuestionData.tolerance);
		if (score == scores.CORRECT) {
			let answerText = currentQuestionData.answer
				.replace('{{valueAmount}}', currentQuestionData.value.amount)
				.replace('{{valueUnit}}', currentQuestionData.value.unit);
			result = '✔️' + answerText;
			markQuestionCompleted(currentQuestion);			
		} else if (score == scores.CLOSE_ENOUGH) {
			let answerText = currentQuestionData.answer
				.replace('{{valueAmount}}', currentQuestionData.value.amount)
				.replace('{{valueUnit}}', currentQuestionData.value.unit);
			result = '🔸' + answerText;
		} else {
			let answerText = currentQuestionData.answer
				.replace('{{valueAmount}}', currentQuestionData.value.amount)
				.replace('{{valueUnit}}', currentQuestionData.value.unit);
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
	}
</script>

<svelte:window on:keydown={handleKeydown}/>

<main>
	<header>
		<!-- <label for="category">Category:</label>
		<select name="category" id="category">
			<option value="default">All</option>
			<option value="grocery">grocery</option>
			<option value="units">units</option>
		</select>

		<label for="region">Region:</label>
		<select name="region" id="region">
			<option value="default">All</option>
			<option value="in">India</option>
			<option value="us">US</option>
		</select> -->
	</header>
	<section id="question">
		{currentQuestionData.question.split('{{valueAmount}}')[0]
			.replace('{{keyAmount}}', currentQuestionData.key?.amount)
			.replace('{{keyUnit}}', currentQuestionData.key?.unit)
			.replace('{{name}}', currentQuestionData?.name)
			.replace('{{valueUnit}}', currentQuestionData.value?.unit)
		}
		<!-- svelte-ignore a11y-autofocus -->
		<input type="number" id="value-amount" bind:value={enteredAmount} autofocus/>

		{currentQuestionData.question.split('{{valueAmount}}')[1]
			.replace('{{keyAmount}}', currentQuestionData.key?.amount)
			.replace('{{keyUnit}}', currentQuestionData.key?.unit)
			.replace('{{name}}', currentQuestionData?.name)
			.replace('{{valueUnit}}', currentQuestionData.value?.unit)
		}
		<div id="results-container">
			<div id="result">
				{#if result}
					{result}
					<div id="source">
						{#if currentQuestionData.source?.link}
							<div class="source-title">Source: </div> 
							<a href={currentQuestionData.source.link}>{currentQuestionData.source.title}</a>
						{:else if currentQuestionData.source?.title}
							<div class="source-title">Source: </div>
							{currentQuestionData.source.title}
						{/if}
					</div>
				{/if}
			</div>
			<div id="error">{error}</div>
		</div>
	</section>
	
	<footer>
		<div id="nextQuestionMsg">{nextQuestionMsg}</div>
	</footer>
</main>

<style>
	main {
		text-align: center;
		padding: 1em;
		height: 100%;
		width: 100%;
		box-sizing: border-box;
		margin: 0 auto;
		background-color: aliceblue;
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
	}
	#question {
		font-size: 2em;
		flex-grow: 1;
		margin-top: 10%;
	}
	#nextQuestionMsg {
		margin-bottom: 0px;
		color: gray;
	}
	#results-container {
		margin-top: 3em;
		font-size: 0.8em;
	}
	#value-amount {
		text-align: center;
		font-family: inherit;
		font-size: inherit;
		padding: 0.2em;
		margin: 0.3em;
		width: 5em;
		border: 0px;
		box-sizing: border-box;
		border-bottom:solid 0.2em #000;
		outline:none; /* prevents textbox highlight in chrome */
	}
	#result {
		color: black;
		flex-grow: 1;
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
	}
	#source {
		font-size: 0.7em;
		display: flex;
		font-style: italic;
		margin: 1em;
	}
	.source-title {
		color: gray;
		margin: auto 0.5em;
	}
	#error {
		color: red;
		flex-grow: 1;
	}

</style>