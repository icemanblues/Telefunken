/**
 *
 */
package com.kluge.blues.telefunken.deck;

import java.util.Map;

import com.google.common.collect.Maps;

/**
 * This class represents a single playing card
 * This class is immutable
 * This class uses the flyweight pattern to reduce memory usage
 *
 * @author <a href="roland.kluge@gmail.com">roland</a>
 */
public final class Card {
	public static final int CARDS_IN_DECK = 52;

	private static final Map<String, Card> INSTANCES = Maps.newHashMapWithExpectedSize(CARDS_IN_DECK);

	private final Rank rank;
	private final Suit suit;
	private final String displayName;

	private Card(Rank rank, Suit suit) {
		this.rank = rank;
		this.suit = suit;
		this.displayName = makeDisplayName(rank, suit);
	}

	public static String makeDisplayName(Rank rank, Suit suit) {
		return rank.getDisplayName() + suit.getDisplayName();
	}

	public static Card of(Rank rank, Suit suit) {
		final String displayName = makeDisplayName(rank, suit);
		if(!INSTANCES.containsKey(displayName)) {
			final Card c = new Card(rank, suit);
			INSTANCES.put(displayName, c);
		}
		return INSTANCES.get(displayName);
	}

	public Rank getRank() {
		return rank;
	}

	public Suit getSuit() {
		return suit;
	}

	@Override
	public int hashCode() {
		final int prime = 31;
		int result = 1;
		result = prime * result + ((rank == null) ? 0 : rank.hashCode());
		result = prime * result + ((suit == null) ? 0 : suit.hashCode());
		return result;
	}

	@Override
	public boolean equals(Object obj) {
		if (this == obj)
			return true;
		if (obj == null)
			return false;
		if (getClass() != obj.getClass())
			return false;
		Card other = (Card) obj;
		if (rank != other.rank)
			return false;
		if (suit != other.suit)
			return false;
		return true;
	}

	@Override
	public String toString() {
		return displayName;
	}
}
