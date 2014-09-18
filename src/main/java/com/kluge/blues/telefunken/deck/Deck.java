/**
 *
 */
package com.kluge.blues.telefunken.deck;

import java.util.Arrays;
import java.util.List;
import java.util.Random;
import java.util.function.Function;
import java.util.function.Supplier;

import com.google.common.collect.ImmutableList;
import com.google.common.collect.Lists;

/**
 * This is a Deck of Playing Cards
 * a container/ collection of Cards
 *
 * A Deck is a Stack, so we'll model it with a List
 * We don't want to actually pop it- otherwise shuffling will be more difficult
 *
 * This class is not thread-safe
 *
 * @author <a href="roland.kluge@gmail.com">roland</a>
 */
public final class Deck {
	public static final int STANDARD_DECK = 52;
	public static final int STANDARD_DECK_WITH_JOKERS = 54;

	private final List<ICard> deck;
	private int next = 0;

	private Deck(List<ICard> deck) {
		super();
		this.deck = Lists.newArrayList(deck);
		this.next = 0;
	}

	/**
	 * @return a deck containing 52 cards
	 */
	public static Deck standardDeck() {
		return new Deck( make52());
	}

	public static Deck standardDeckWithJokers() {
		return new Deck( make54());
	}

	/**
	 * @param numDecks the number of decks to be created
	 * @return creates multiple decks and combines them into one
	 */
	public static Deck standardDeck(final int numDecks) {
		return multiDeck(numDecks, Deck::make52);
	}

	public static Deck standardDeckWithJokers(final int numDecks) {
		return multiDeck(numDecks, Deck::make54);
	}

	private static Deck multiDeck(final int numDecks, Supplier<List<ICard>> deckGenerator) {
		final List<ICard> cards = Lists.newLinkedList();
		for(int i=0; i< numDecks; i++) {
			cards.addAll(deckGenerator.get());
		}
		return new Deck(cards);
	}

	private static List<ICard> make52() {
		List<ICard> list = Lists.newArrayListWithCapacity(Deck.STANDARD_DECK);
		fill52(list);
		return list;
	}

	private static void fill52(final List<ICard> list) {
		Arrays.stream(Rank.values()).forEach(rank -> {
			Arrays.stream(Suit.values()).forEach(suit -> {
				list.add(StandardCard.of(rank, suit));
			});
		});
	}

	private static List<ICard> make54() {
		List<ICard> list = Lists.newArrayListWithCapacity(STANDARD_DECK_WITH_JOKERS);
		fill52(list);
		list.add(JokerCard.JOKER);
		list.add(JokerCard.JOKER);
		return list;
	}

	public boolean hasNext() {
		return next < deck.size();
	}

	public int size() {
		return deck.size();
	}

	public ICard next() {
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
			final ICard temp = deck.get(a);
			deck.set(a, deck.get(b));
			deck.set(b, temp);
		}
		next = 0;
	}

	public static void main(String[] args) {
		Deck deck = Deck.standardDeckWithJokers(2);

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
