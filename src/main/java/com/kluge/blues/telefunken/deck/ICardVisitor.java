/**
 *
 */
package com.kluge.blues.telefunken.deck;

/**
 * This is the interface for the Visitor pattern. This will allow
 * card implementation specific handling of cards from a deck
 *
 * The return type is generic, so that the visitor can return anything appropriate
 * as the methods that apply to cards
 *
 * @author <a href="roland.kluge@gmail.com">roland</a>
 */
public interface ICardVisitor<T> {

	public T visit(ICard card);

	public T visit(StandardCard card);

	public T visit(JokerCard card);
}
