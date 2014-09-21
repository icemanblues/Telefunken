/**
 *
 */
package com.kluge.blues.telefunken.player;

import java.util.List;

import com.kluge.blues.telefunken.deck.ICard;

/**
 * @author roland
 *
 */
public interface IPlayer {
	/**
	 * @return the name of the player
	 */
	public String getName();

	/**
	 * @return the hand of the player
	 */
	public List<ICard> getHand();

	/**
	 * Indicates that the round is over and any state should be cleaned up.
	 */
	public void reset();
}
