/*
Created by Nathan Baylon. Feb 2020.

FINISHED (17/02/2020): Convert the display text to an array that contains words and add the following features:
    - Change the generate button to change the words within the display-box
    - Highlight each word when the user is currently typing it rather than the whole sentence
        - If the user is up to the word but hasn't typed it make the background grey
        - If the user has typed in incorrect word, make the background red
        - If the user has typed the complete word correctly and has pressed the spacebar, make the word's text green
    - Add a one minute timer to time the user typing
    - Calculate the WPM of the user by appending the typed words to an array then ( amt-of-words / time-taken-to-type )
    - Create a results table of the users stats
After finishing: Didn't need to convert the display text to an array as I used html class attributes to loop through the display text

TODO: Create a settings toolbar with the following features (See which features are worth keeping):
    - A feature where you can add words to the word array
    - Deleting words from the array?
    - Right and left handed typing
    - Changing the timer?
    - Changing the amount of words in the display box?
    - Hiding the results table
    - Light mode and dark mode
 
*/


// DECLARING VARIABLES //

// The pool of words that can be randomly generated
import { wordArr } from "./words.js";

const WORD_AMT = 30; // The amount of words in the display box
let timerDuration = 60; // Timer duration in seconds

// customArr becomes a copy of wordArr due to how assignment works for arrays, can be altered by user
let customArr = [...wordArr];

// Commonly used DOM elements
const inputBox = document.getElementById("type-box");
const displayBox = document.getElementById("display-box");
const displayTimer = document.getElementById("timer");
let focusElement = null; // mutable

// Typing Stats - all these veriables are mutable
let correctWords = 0;
let incorrectWords = 0;
let wpm = 0;
let correctStrokes = 0;
let incorrectStrokes = 0;
let keystrokes = correctStrokes + incorrectStrokes;
let accuracy = keystrokes == 0 ? NaN : correctStrokes / keystrokes; // If keystrokes is equal to 0 than it is NaN, else calculate percentage

// Timer interval

let interval = null;

// Test flag that checks if a timer is running

let testRun = false;

// ON LOAD //

window.onload = function () {

    inputBox.focus();

    resetTest(customArr); //Initial reset

    // Adds event listeners to the corresponding buttons when clicked
    document.getElementById("reset-btn").addEventListener("click", function(){resetTest()}); // Resets test
    document.getElementById("toggle-results-btn").addEventListener("click", function(){toggleResults()}); // Toggles table visibility

    document.getElementById("add-word-btn").addEventListener("click", function(){addWord()}); // Adds a word to the word pool
    document.getElementById("add-word-input").addEventListener("keyup", function(event) {     // Executes addWord() on enter when in text input
        if (event.keyCode === 13) {
            event.preventDefault();

            document.getElementById("add-word-btn").click();
        }
    })

    document.getElementById("reset-pool-btn").addEventListener("click", function(){resetPool()}); // Removes all custom words
}

// FUNCTIONS //

// When a key goes up, check that the value in the type-box is equal to the display text
inputBox.onkeyup = function () {

    if(testRun === false) {
        resetStats();
        startTimer(timerDuration, displayTimer);
    }

    if (inputBox.value.match(/\s/)) {    // If there is whitespace in the input box

        if (inputBox.value === " ") { // If the user enters only whitespace, clear the inputBox
            inputBox.value = "";
        } else if (inputBox.value === focusElement.innerText + " ") { // If the word is correct
            // Update classes
            focusElement.className = focusElement.className.replace(/(?:^|\s)typo(?!\S)/g, ''); // If the word is autocorrected, the word can have both the 'correct' and 'typo' classes, so remove the class just in case
            focusElement.className = focusElement.className.replace(/(?:^|\s)focus(?!\S)/g, '');
            focusElement.className = focusElement.className.replace(/(?:^|\s)incomplete(?!\S)/g, ' complete')
            focusElement.className += " correct";

            // Update correct stats
            correctWords++;
            document.getElementById("correct-words-data").innerText = correctWords;

            // If there are no longer any incomplete words, generate new words, if not then find the next incomplete word to focus
            if (document.getElementsByClassName("incomplete").length == 0) {
                generateTest();
            } else {
                focusElement = document.getElementsByClassName("incomplete")[0];
                focusElement.className += " focus";
                inputBox.value = "";
            }

        } else {    // If the word is incorrect
            // Update classes
            focusElement.className = focusElement.className.replace(/(?:^|\s)focus(?!\S)/g, '');
            focusElement.className = focusElement.className.replace(/(?:^|\s)typo(?!\S)/g, '');
            focusElement.className = focusElement.className.replace(/(?:^|\s)incomplete(?!\S)/g, ' complete')
            focusElement.className += " incorrect";

            // Update incorrect stats
            incorrectWords++;
            document.getElementById("incorrect-words-data").innerText = incorrectWords;

            // If there are no longer any incomplete words, generate new words, if not then find the next incomplete word to focus
            if (document.getElementsByClassName("incomplete").length == 0) {
                generateTest();
            } else {
                focusElement = document.getElementsByClassName("incomplete")[0];
                focusElement.className += " focus";
                inputBox.value = "";
            }
        }

    } else if (inputBox.value !== focusElement.innerText.slice(0, inputBox.value.length)) {   // If the value of the inputBox is not equal to the focus element characters up to the inputBox value's length
    
        // Incorrect Keystroke

        if(event.keyCode != 8) { // If the key that is being up is NOT the backspace key (8 is the key code for backspace) then count it as in incorrect keystroke
            incorrectStrokes++;
            document.getElementById("incorrect-strokes-data").innerText = incorrectStrokes;
        }
    
        // If the focus element doesn't have the typo class, add it to the focus element
        if (!focusElement.className.match(/(?:^|\s)typo(?!\S)/g)) {
            focusElement.className += " typo";
        }
    } else if (inputBox.value === focusElement.innerText.slice(0, inputBox.value.length)) {   // If the input is correct, make sure that the incorrect tag is removed

        // Correct Keystroke
        if(inputBox.value != "") { // Prevents counting a blank backspace as a correct keystroke
            correctStrokes++;
            document.getElementById("correct-strokes-data").innerText = correctStrokes;
        }
        
        focusElement.className = focusElement.className.replace(/(?:^|\s)typo(?!\S)/g, '');
    }

    // Update total keystrokes
    keystrokes = correctStrokes + incorrectStrokes;
    document.getElementById("keystrokes-data").innerText = keystrokes;

    // Update accuracy
    accuracy = keystrokes === 0 ? NaN : correctStrokes / keystrokes;
    document.getElementById("accuracy-data").innerText = (accuracy * 100).toFixed(2) + "%";
}

// Generates random words from a given array
function generateRandomWord(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

// Generate new words for a test
function generateTest() {
    displayBox.innerHTML = "";
    inputBox.value = "";
    for (let i = 0; i < WORD_AMT; i++) {
            displayBox.innerHTML += '<span class="type incomplete">' + generateRandomWord(customArr) + '</span> ';
    }

    document.getElementsByClassName("incomplete")[0].className += " focus";

    focusElement = document.getElementsByClassName("focus")[0];
}

// Reset the stats displayed in the table
function resetStats() {
    wpm = 0;
    correctWords = 0;
    incorrectWords = 0;
    keystrokes = 0;
    correctStrokes = 0;
    incorrectStrokes = 0;
    accuracy = keystrokes === 0 ? NaN : correctStrokes / keystrokes;
    testRun = false;
    clearInterval(interval);

    let timer = timerDuration, minutes, seconds;

    minutes = parseInt(timer / 60, 10);
    seconds = parseInt(timer % 60, 10);

    seconds = seconds < 10 ? "0" + seconds : seconds;

    displayTimer.textContent = minutes + ":" + seconds;
    document.getElementById("correct-words-data").innerText = correctWords;
    document.getElementById("incorrect-words-data").innerText = incorrectWords;
    document.getElementById("wpm-data").innerText = wpm;
    document.getElementById("keystrokes-data").innerText = keystrokes;
    document.getElementById("correct-strokes-data").innerText = correctStrokes;
    document.getElementById("incorrect-strokes-data").innerText = incorrectStrokes;
    document.getElementById("accuracy-data").innerText = accuracy + "%";
} 

// Reset a test and its stats
function resetTest() {
    resetStats();
    generateTest();
}

// Starts a timer and displays to a given element
function startTimer(duration, display) {
    duration--;
    testRun = true;
    let timer = duration, minutes, seconds;
    interval = setInterval(function () {
        minutes = parseInt(timer / 60, 10);
        seconds = parseInt(timer % 60, 10);

        // minutes = minutes < 10 ? "0" + minutes : minutes;
        seconds = seconds < 10 ? "0" + seconds : seconds;

        display.textContent = minutes + ":" + seconds;
        document.getElementById("wpm-data").innerText = duration - timer <= 0 ? 0 : ((correctStrokes / 5) / (duration - timer) * 60).toFixed(1); // Calculate WPM 

        if (--timer < 0) {
            console.log("finished!");
            clearInterval(interval);
            inputBox.blur();
            inputBox.value = "";
            generateTest();
            testRun = false;
        }
    }, 1000);
}

// Adds a word to a given word array
function addWord() {
    // If the input isn't an empty string
    if(document.getElementById("add-word-input").value !== "") {
        customArr.push(document.getElementById("add-word-input").value.match(/[\w,.?!@#$%^&*()_+-=~`'\\]+/g)[0]);
        document.getElementById("add-word-input").value = "";
        resetTest();
    }
}

// Toggles the visibility of the results table
function toggleResults() {
    if(document.getElementById("toggle-results-btn").innerText === "Hide Stats") {
        document.getElementById("results-container").style.display = "none";
        document.getElementById("toggle-results-btn").innerText = "Show Stats";
    } else {
        document.getElementById("results-container").style.display = "block";
        document.getElementById("toggle-results-btn").innerText = "Hide Stats";
    }
}

// Removes all customs words from customArr
function resetPool() {
    customArr = [...wordArr];
    generateTest();
}