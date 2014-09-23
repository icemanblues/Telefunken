/**
 *
 */
package com.kluge.blues.telefunken.game;

import java.util.List;

import com.google.common.collect.Lists;
import com.kluge.blues.telefunken.deck.Deck;
import com.kluge.blues.telefunken.deck.ICard;
import com.kluge.blues.telefunken.deck.visitor.IsWildVisitor;
import com.kluge.blues.telefunken.game.meld.Contract;
import com.kluge.blues.telefunken.game.meld.Meld;
import com.kluge.blues.telefunken.player.IPlayer;

/**
 * This represents one round of Telefunken
 * The cards are shuffled and dealt out to the players
 * All players receive 11 cards.
 * The top card is dealt to the discard pile
 * Each player takes their turn
 * until one player is out of cards
 *
 * @author <a href="mailto:roland.kluge@gmail.com">roland</a>
 * @since Sep 21, 2014
 */
public class TelefunkenRound {
	public static final int STARTING_HAND_SIZE = 11;

	private final TelefunkenGame game;
	private final Deck deck;

	private final List<IPlayer> players;
	private final int dealer;

	private final List<Meld> melds;
	private final Contract contract;

	private final IsWildVisitor isWild = new IsWildVisitor();

	public TelefunkenRound(TelefunkenGame game, Contract contract, Deck deck, List<IPlayer> players, int dealer) {
		super();
		this.game = game;
		this.contract = contract;
		this.deck = deck;
		this.players = players;
		this.dealer = dealer;
		this.melds = Lists.newArrayList();
	}

	public void start() {
		deck.shuffle();
		players.forEach(p -> p.reset());

		dealCard(players, dealer, STARTING_HAND_SIZE);
		ICard discard = deck.next();

		int curr = nextPlayer(dealer);

		offerDiscard(discard, curr);
	}

	private void dealCard(List<IPlayer> players, int dealer, int numCards) {
		// TODO: deal out 11 cards to each player
	}

	private int nextPlayer(int currentPlayer) {
		return (currentPlayer + 1) % players.size();
	}

	private void offerDiscard(ICard discard, int curr) {
		if(! discard.accept(isWild)) {
			// should not offer to a player who is out of buys
			for(int i=0; i<players.size(); i++) {
				final boolean isBuy = players.get(curr).buy(discard);
				if(isBuy) {
					IPlayer player = players.get(curr);
					playerBuys(player, discard);
				}
			}
		}
	}

	private void playerBuys(IPlayer player, ICard discard) {

	}
}
