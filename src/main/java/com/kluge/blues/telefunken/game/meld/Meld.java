/**
 *
 */
package com.kluge.blues.telefunken.game.meld;

import java.util.List;

import com.kluge.blues.telefunken.deck.ICard;
import com.kluge.blues.telefunken.deck.JokerCard;
import com.kluge.blues.telefunken.player.IPlayer;

/**
 * A Meld is a play in a Rummy-style game. There are two main types of Melds in Telefunken,
 * a Set and a Run. A set is 3 or more cards that all have the same rank. A run is 3 or more cards
 * that all have the same suit and are consecutive ranks.
 *
 * @author roland
 *
 */
public interface Meld {
	/**
	 * @return the number of cards within this meld
	 */
	public int size();

	/**
	 * @return all of the cards in this meld
	 */
	public List<ICard> getCards();

	/**
	 * @return the player who played this meld
	 */
	public IPlayer getOwner();

	/**
	 * default implemention that will search all of the cards in a meld for a joker
	 * @return true if this meld contains a wild card
	 */
	default
	public boolean hasWild() {
		return getCards().stream().anyMatch(c -> c instanceof JokerCard);
	}
}
