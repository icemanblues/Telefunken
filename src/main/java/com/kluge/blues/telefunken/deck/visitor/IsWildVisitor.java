/**
 *
 */
package com.kluge.blues.telefunken.deck.visitor;

import com.kluge.blues.telefunken.deck.ICard;
import com.kluge.blues.telefunken.deck.ICardVisitor;
import com.kluge.blues.telefunken.deck.JokerCard;
import com.kluge.blues.telefunken.deck.Rank;
import com.kluge.blues.telefunken.deck.StandardCard;

/**
 * This visitor determines if a card is wild
 * This class is thread-safe
 *
 * @author <a href="mailto:roland.kluge@gmail.com>roland</a>
 */
public class IsWildVisitor implements ICardVisitor<Boolean> {

	@Override
	public Boolean visit(ICard card) {
		return false;
	}

	@Override
	public Boolean visit(StandardCard card) {
		return Rank.TWO.equals(card.getRank());
	}

	@Override
	public Boolean visit(JokerCard card) {
		return true;
	}
}
