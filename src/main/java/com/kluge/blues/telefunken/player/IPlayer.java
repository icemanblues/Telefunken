/**
 *
 */
package com.kluge.blues.telefunken.player;

import java.util.List;

import com.kluge.blues.telefunken.deck.ICard;
import com.kluge.blues.telefunken.game.IPlay;

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
	 * The discard card is shown to all players, if they want to buy it
	 *
	 * @param card the top discard card
	 * @return true if the user wants to buy it
	 */
	public boolean buy(ICard card);

	/**
	 * A player's turn starts when they pick up a card. This card is added to their hand
	 * @param card the card that the player picks up when its their turn
	 */
	public void startTurn(ICard card);

	/**
	 * This will be called repeated until startTurn(). It is all of the plays that the player
	 * can make in their turn. The final play should be an end turn- which signals that the turn is over
	 * and contains the discard card
	 * @return a play from the user
	 */
	public IPlay getPlay();

	/**
	 * Indicates that the round is over and any state should be cleaned up.
	 */
	public void reset();
}
