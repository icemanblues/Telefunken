/**
 *
 */
package com.kluge.blues.telefunken.deck;

import java.util.Arrays;
import java.util.List;
import java.util.Random;

import com.google.common.collect.Lists;

/**
 * This is a Deck of Playing Cards
 * a container/ collection of Cards
 *
 * A Deck is a Stack, so we'll model it with a List
 * We don't want to actually pop it- otherwise shuffling will be more difficult
 *
 * @author <a href="roland.kluge@gmail.com">roland</a>
 */
public class Deck {
	private List<Card> deck;
	private int next = 0;

	private Deck(List<Card> deck) {
		super();
		this.deck = deck;
		this.next = 0;
	}

	/**
	 * @return a deck containing 52 cards
	 */
	public static Deck standardDeck() {
		return new Deck( make52());
	}

	/**
	 * @param numDecks the number of decks to be created
	 * @return creates multiple decks and combines them into one
	 */
	public static Deck standardDeck(final int numDecks) {
		final List<Card> cards = Lists.newArrayListWithExpectedSize(numDecks * Card.CARDS_IN_DECK);
		for(int i=0; i< numDecks; i++) {
			cards.addAll(make52());
		}
		return new Deck(cards);
	}

	private static List<Card> make52() {
		List<Card> list = Lists.newArrayListWithExpectedSize(Card.CARDS_IN_DECK);

		Arrays.asList(Rank.values()).forEach(rank -> {
			Arrays.asList(Suit.values()).forEach(suit -> {
				list.add(Card.of(rank, suit));
			});
		});

		return list;
	}

	public boolean hasNext() {
		return next < deck.size();
	}

	public int size() {
		return deck.size();
	}

	public Card next() {
		return deck.get(next++);
	}

	public void shuffle() {
		// randomly swap around the cards in the list
		// reset the next card index
		final int size = deck.size();
		final Random random = new Random();
		for(int i=0; i<deck.size()*8; i++) {
			final int a = random.nextInt(size);
			final int b = random.nextInt(size);

			//swap a and b
			final Card temp = deck.get(a);
			deck.set(a, deck.get(b));
			deck.set(b, temp);
		}
		next = 0;
	}

	public static void main(String[] args) {
		Deck deck = Deck.standardDeck(2);

		int size = deck.size();
		System.out.println("This deck has " + size + " cards");

		while(deck.hasNext()) {
			System.out.println(deck.next());
		}

		System.out.println("Shuffling...");
		deck.shuffle();

		while(deck.hasNext()) {
			System.out.println(deck.next());
		}
	}
}
