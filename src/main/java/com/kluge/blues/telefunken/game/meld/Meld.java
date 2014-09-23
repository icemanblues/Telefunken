/**
 *
 */
package com.kluge.blues.telefunken.game.meld;

import java.util.List;

import com.google.common.collect.Lists;
import com.kluge.blues.telefunken.deck.ICard;
import com.kluge.blues.telefunken.deck.JokerCard;
import com.kluge.blues.telefunken.deck.visitor.IsWildVisitor;
import com.kluge.blues.telefunken.player.IPlayer;

/**
 * A Meld is a play in a Rummy-style game. There are two main types of Melds in Telefunken,
 * a Set and a Run. A set is 3 or more cards that all have the same rank. A run is 3 or more cards
 * that all have the same suit and are consecutive ranks.
 *
 * @author roland
 *
 */
public class Meld {
	private final MeldType type;
	private final List<ICard> cards;
	private final IPlayer owner;

	final IsWildVisitor isWild = new IsWildVisitor();

	private Meld(final MeldType meldType, final List<ICard> cards, final IPlayer owner) {
		super();
		this.type = meldType;
		this.cards = cards;
		this.owner = owner;
	}

	public static Meld run(IPlayer owner, ICard... cards) {
		return new Meld(MeldType.RUN, Lists.newArrayList(cards), owner);
	}

	public static Meld run(IPlayer owner, List<ICard> cards) {
		return new Meld(MeldType.RUN, cards, owner);
	}

	public static Meld set(IPlayer owner, ICard... cards) {
		return new Meld(MeldType.SET, Lists.newArrayList(cards), owner);
	}

	public static Meld set(IPlayer owner, List<ICard> cards) {
		return new Meld(MeldType.SET, cards, owner);
	}

	/**
	 * @return the number of cards within this meld
	 */
	public int size() {
		return cards.size();
	}

	/**
	 * @return all of the cards in this meld
	 */
	public List<ICard> getCards() {
		return cards;
	}

	/**
	 * @return the player who played this meld
	 */
	public IPlayer getOwner() {
		return owner;
	}

	/**
	 * @return the type of meld
	 */
	public MeldType getMeldType() {
		return type;
	}

	/**
	 * searches all of the cards in a meld for a joker
	 * @return true if this meld contains a wild card
	 */
	public boolean hasWild() {
		// May want to memoize this if it becomes a performance issue
		// too many calls to hasWild before the Meld is altered
		return getCards().stream().anyMatch(c -> c.accept(isWild));
	}
}
