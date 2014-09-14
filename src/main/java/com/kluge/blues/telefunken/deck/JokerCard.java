/**
 *
 */
package com.kluge.blues.telefunken.deck;

/**
 * This card represents a joker. A Joker has neither a suit nor a rank
 * This class is immutable.
 * It is a singleton
 *
 * @author <a href="roland.kluge@gmail.com">roland</a>
 */
public enum JokerCard implements ICard {

	JOKER;

	@Override
	public <T> T accept(ICardVisitor<T> cardVisitor) {
		return cardVisitor.visit(this);
	}
}
