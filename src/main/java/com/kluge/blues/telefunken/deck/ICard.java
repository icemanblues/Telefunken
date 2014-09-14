/**
 *
 */
package com.kluge.blues.telefunken.deck;

/**
 * This represents a card in the deck
 *
 * @author <a href="roland.kluge@gmail.com">roland</a>
 */
public interface ICard {

	/**
	 * For double dispatch
	 *
	 * @param cardVisitor the visitor to apply to the ICard
	 * @return the results of the visitor
	 */
	public <T> T accept(ICardVisitor<T> cardVisitor);
}
