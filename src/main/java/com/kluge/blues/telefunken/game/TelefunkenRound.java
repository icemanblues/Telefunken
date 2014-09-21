/**
 *
 */
package com.kluge.blues.telefunken.game;

import java.util.List;

import com.google.common.collect.Lists;
import com.kluge.blues.telefunken.deck.Deck;
import com.kluge.blues.telefunken.deck.ICard;
import com.kluge.blues.telefunken.game.meld.Contract;
import com.kluge.blues.telefunken.game.meld.Meld;
import com.kluge.blues.telefunken.player.IPlayer;

/**
 * @author roland
 *
 */
public class TelefunkenRound {
	private final Deck deck;
	private ICard discard;

	private final List<IPlayer> players;
	private int dealer;

	private final List<Meld> melds;
	private final Contract contract;

	public TelefunkenRound(Contract contract, Deck deck, List<IPlayer> players, int dealer) {
		super();
		this.deck = deck;
		this.players = players;
		this.dealer = dealer;
		this.contract = contract;
		this.melds = Lists.newArrayList();

	}
}
