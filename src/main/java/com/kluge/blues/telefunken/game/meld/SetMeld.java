/**
 *
 */
package com.kluge.blues.telefunken.game.meld;

import java.util.List;

import com.kluge.blues.telefunken.deck.ICard;
import com.kluge.blues.telefunken.player.IPlayer;

/**
 * This presents a "set"
 * All cards in a set must have the same rank (ignoring jokers)
 * @author roland
 *
 */
public class SetMeld implements Meld {
	private final List<ICard> cards;
	private final IPlayer owner;

	private SetMeld(List<ICard> cards, IPlayer owner) {
		super();
		this.cards = cards;
		this.owner = owner;
	}

	@Override
	public int size() {
		return cards.size();
	}

	@Override
	public List<ICard> getCards() {
		return cards;
	}

	@Override
	public IPlayer getOwner() {
		return owner;
	}
}
