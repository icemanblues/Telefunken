/**
 *
 */
package com.kluge.blues.telefunken.deck;

/**
 * This is the suit of a playing card
 *
 * @author <a href="roland.kluge@gmail.com">roland</a>
 */
public enum Suit {
	SPADES		("\u2660"),
	HEARTS		("\u2665"),
	DIAMONDS	("\u2666"),
	CLUBS		("\u2663");

	private final String displayName;

	private Suit(String displayName) {
		this.displayName = displayName;
	}

	public String getDisplayName() {
		return displayName;
	}
}
