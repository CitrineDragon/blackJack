'use strict';

const API_BASE_URL = 'https://www.deckofcardsapi.com/api/deck';
const dealerDiv = document.getElementById('dealer-hand');
const playerDiv = document.getElementById('player-hand');
const result = document.getElementById('result');
const dealerWins = document.querySelector('.dealerWins');
const playerWins = document.querySelector('.playerWins');

let deckId = '';
let playerTurn = true;
let playerHand = [];
let dealerHand = [];
let dealerCount = 0;
let playerCount = 0;

async function getDeck() {
  try {
    const res = await fetch(`${API_BASE_URL}/new/shuffle/?deck_count=1`);
    const data = await res.json();
    deckId = data.deck_id;
  } catch (error) {
    console.error('Error while fetching the deck:', error);
  }
}

async function shuffleDeck() {
  try {
    await fetch(`${API_BASE_URL}/${deckId}/shuffle/`);
    console.log('Deck shuffled');
  } catch (error) {
    console.error('Error while shuffling the deck:', error);
  }
}

async function startGame() {
  try {
    await shuffleDeck();
    emptyHands();
    result.textContent = '';
    playerTurn = true;

    const res = await fetch(`${API_BASE_URL}/${deckId}/draw/?count=4`);
    const data = await res.json();

    playerHand.push(data.cards[0]);
    dealerHand.push(data.cards[1]);
    playerHand.push(data.cards[2]);
    dealerHand.push(data.cards[3]);

    await updateGame();
  } catch (error) {
    console.error('Error while starting the game:', error);
  }
}

async function updateGame() {
  while (playerDiv.firstChild) {
    playerDiv.removeChild(playerDiv.firstChild);
  }
  while (dealerDiv.firstChild) {
    dealerDiv.removeChild(dealerDiv.firstChild);
  }

  //Update cards on the table
  playerHand.forEach((val) => {
    const img = document.createElement('img');
    img.src = val.image;
    img.classList.add('cardImg');
    playerDiv.append(img);
  });

  dealerHand.forEach((val, i) => {
    if (i === 1) {
      const img = document.createElement('img');
      img.src = 'https://www.deckofcardsapi.com/static/img/back.png';
      img.classList.add('cardImg');
      img.classList.add('hiddenCard');
      dealerDiv.append(img);
    } else {
      const img = document.createElement('img');
      img.src = val.image;
      img.classList.add('cardImg');
      dealerDiv.append(img);
    }
  });
  checkWinner();

  dealerWins.textContent = `${dealerCount} ${
    dealerCount === 1 ? `Win` : `Wins`
  }`;
  playerWins.textContent = `${playerCount} ${
    playerCount === 1 ? `Win` : `Wins`
  }`;
}

// Emptys both hands
function emptyHands() {
  playerHand = [];
  dealerHand = [];
}

// Draws a card from the deck
async function draw(arr) {
  try {
    const res = await fetch(`${API_BASE_URL}/${deckId}/draw/?count=1`);
    const data = await res.json();
    arr.push(data.cards[0]);
  } catch (error) {
    console.error('Error while drawing a card:', error);
  }
}

// ========== Player Actions ==========
// Hit: Deal a card to the player
async function hit() {
  await draw(playerHand);
  await updateGame();
}

// Stand: Dealer plays their hand
async function stand() {
  playerTurn = false;
  while ((await calculateHandValue(dealerHand)) < 17) {
    await draw(dealerHand);
  }

  updateGame();
  document.querySelector('.hiddenCard').src = `${dealerHand[1].image}`;
}

function checkWinner() {
  //Check for Blackjack
  if (hasBlackjack(playerHand)) {
    result.textContent = 'Blackjack! Player wins!';
    playerCount++;
    console.log('phb');
  } else if (hasBlackjack(dealerHand)) {
    result.textContent = 'Blackjack! Dealer wins!';
    document.querySelector('.hiddenCard').src = `${dealerHand[1].image}`;
    dealerCount++;
    console.log('dhb');
  } else if (isBust(playerHand)) {
    result.textContent = 'Bust! Dealer wins!';
    dealerCount++;
    console.log('pb');
  } else if (isBust(dealerHand)) {
    result.textContent = 'Dealer busts! Player wins!';
    playerCount++;
    console.log('db');
  } else if (
    playerTurn === false &&
    calculateHandValue(dealerHand) >= calculateHandValue(playerHand)
  ) {
    result.textContent = 'Dealer wins!';
    dealerCount++;
    console.log('dw');
  } else if (
    playerTurn === false &&
    calculateHandValue(playerHand) >= calculateHandValue(dealerHand)
  ) {
    result.textContent = 'Player wins!';
    playerCount++;
    console.log('pw');
  }
}

// ========== Hand Evaluation Functions ==========
// Get the card's numeric value
function getCardValue(card) {
  if (card.value === 'ACE') {
    return 11;
  } else if (
    card.value === 'KING' ||
    card.value === 'QUEEN' ||
    card.value === 'JACK'
  ) {
    return 10;
  } else {
    return parseInt(card.value);
  }
}

// Calculate the total value of a hand
function calculateHandValue(hand) {
  let sum = hand.reduce((total, card) => total + getCardValue(card), 0);
  let numAces = hand.filter((card) => card.value === 'ACE').length;

  while (sum > 21 && numAces > 0) {
    sum -= 10;
    numAces--;
  }

  return sum;
}

// ========== Winning Conditions ==========
// // Check for Blackjack (Ace + 10-value card) in a hand
function hasBlackjack(hand) {
  return hand.length === 2 && calculateHandValue(hand) === 21;
}

// Check for bust (hand value > 21)
function isBust(hand) {
  return calculateHandValue(hand) > 21;
}

getDeck();

// Event listeners for buttons
document.getElementById('start').addEventListener('click', startGame);
document.getElementById('hit').addEventListener('click', hit);
document.getElementById('stand').addEventListener('click', stand);
