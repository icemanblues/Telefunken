/**
 *
 */
package com.kluge.blues.telefunken.deck;

/**
 * This is the rank of a playing card, 2-10, J, Q, K A
 *
 * @author <a href="roland.kluge@gmail.com">roland</a>
 */
public enum Rank {
	TWO		("2"),
	THREE	("3"),
	FOUR	("4"),
	FIVE	("5"),
	SIX		("6"),
	SEVEN	("7"),
	EIGHT	("8"),
	NINE	("9"),
	TEN		("10"),
	JACK	("J"),
	QUEEN	("Q"),
	KING	("K"),
	ACE		("A");

	private final String displayName;

	private Rank(String displayName) {
		this.displayName = displayName;
	}

	public String getDisplayName() {
		return displayName;
	}
}
