/**
 *
 */
package com.kluge.blues.telefunken.game.meld;

import java.util.List;

import com.kluge.blues.telefunken.deck.ICard;
import com.kluge.blues.telefunken.player.IPlayer;

/**
 * A Run is when 3 or more cards are all of the same suit and consecutive ranks.
 * @author roland
 *
 */
public class RunMeld implements Meld {
	private final IPlayer owner;
	private final List<ICard> cards;

	public RunMeld(IPlayer owner, List<ICard> cards) {
		super();
		this.owner = owner;
		this.cards = cards;
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
