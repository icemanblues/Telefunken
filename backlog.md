# Agentic

* [ ] Update /init
  - give it a better understanding and purpose for this project.
  - give it the architectural thoughts into this
  - give it how we work, the process and expectations
  - always write unit tests
    - always verify that all tests are passing, all linters, all compilation is passing
    
  - when stuck, blocked, or unsure, ask me a clarifying question. Always can interview me when there is uncertainity in what to do next

* [ ] Skill for commits

* [ ] subagent for reviews

* [ ] subagent for adversarial reviews

# Product Features

* [ ] The first dealer is chosen at random
* [ ] introduce a seed so that a PRNG can be used to repeat the same game.

* [ ] The leaderboard should indicate which player is the dealer.

* [ ] game gets stuck with a CPU thinking...

* [ ] After you have melded, you are no longer allowed to buy cards from the discard pile.

* [ ] The activity log spells out the card name "12 of hearts". 
  - It should use the same characters that are displayed on the cards.
  - it should also the same text colors as the displayed cards.

* Activity Log Card entry Improvements
  * [ ] new game log should say, new game
  * [ ] the discard card action should state that the card was discarded
  * [ ] When a card is bought, it should be display in the activity log card
  * [ ] When a meld is played, it should display the cards in the meld in the activity log. 3H or 8S (use the unicode logo)

  All of the events should have their action type cleared displayed in bold text.
  New Game Started. Discarded. Played Meld. Added to Meld. Bought.

* [ ] First Meld has to meet the contract specs.
  - Give an error message /toast that is very clear that the first meld must meet the contract. The describe what the contract is.

* [] Activity log placement
  -   Activity Logs should be on the right side on larger screens.


# Technical Features

* [ ] add svelte as the UI presentation layer
  - It must be written as a PWA (progressive web app)

* [ ] add playwright for enhanced testing
  - playright can do visual testing that the application is working as intended.

# Maybe

* [ ] 2's are also considered wild (jokers) in telefunken
There are no jokers added to the deck for peruvian telefunken

* Undo button
  - do we want to allow the player to undo a play.
    - would be nice in case there is a mouse-slip or something is pressed by accident.
    - however, it can be abused and is effectively a time-travel cheat.

# Completed

* [x] Remove [Stop Auto-play] button
  - Also redo how buying discards is handled

* [x] button to sort the player cards
  - by Rank, then by suit
  - By suit, then by rank

* [x] Add unit tests for the sort by rank, sort by suit functions.
  - also change sort order to be diamonds, clubs, hearts, spades (alternating colors)

* [x] Spades and Clubs are shown with a black background and white text. This is jarring since hearts and diamonds are using a white background with red text.
Change the diamonds and clubs to use a white background with black text.

* [x] Activity Log in the right side.
  - can see what the other players did
    - draw a card
    - played a meld
    - added to a meld
    - discarded a card, which ends the turn
    - bought a card.

* [x] The sort by suit, sort by rank buttons should be above the cards in hand.

* [x] javascript refactor to typescript
  - [x] move to use Vite (or esbuild) as the javascript bundler
  - [x] pnpm for the package manager
  - [x] move all code to typescript.
  - [x] create modules based on common use cases
    - game
      - (cards, deck, meld, leaderboard, etc)
      - engine
    - players
      - interface for a player
      - human player
      - AI bot player
      - AI decision logic
    - pure validators
    - pure util functions (sort by rank, sort by suit)
    - activity log
      - activity log entry class
      - activity log class that contains a list of entries
      - converting game events into activity log events and card to display
      
    - UI items
      - components and wiring to the DOM / html

* [x] ui.ts isn't typescript migrated.
  - It still has typescript complication issues

* [x] Human player cannot press any buttons until it is their turn.
  - All of their buttons should be disabled and grayed out.
When it was the CPU's turn, I was able to press buy discard and end turn.
Surprisingly, buy discard worked. End Turn didn't seem to do anything.
Buy Discard should be removed. There is a buy prompt that goes around.
