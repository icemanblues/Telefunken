/**
 *
 */
package com.kluge.blues.telefunken.game;

import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.function.Function;
import java.util.stream.Collectors;

import com.google.common.collect.Lists;
import com.kluge.blues.telefunken.deck.Deck;
import com.kluge.blues.telefunken.game.meld.Contract;
import com.kluge.blues.telefunken.player.IPlayer;

/**
 * This class represents one game of Telefunken
 * There are 6 rounds in Telefunken (as represented by TelefunkenRound)
 * There are 4 players. The deck consists of 2 decks (with or without jokers)
 * Each player has 6 buys
 *
 * @author <a href="mailto:roland.kluge@gmail.com">roland</a>
 * @since Sep 21, 2014
 */
public class TelefunkenGame {
	private static final int INITIAL_BUY = 6;
	private static final int NUM_DECKS = 2;

	private final Deck deck;
	private final List<IPlayer> players;
	private final Map<IPlayer, Integer> buyCount;

	private int roundNumber = 0;

	// the contracts for each round
	private final List<Contract> contracts = Lists.newArrayList(
			Contract.of(2, 3),
			Contract.of(1, 4),
			Contract.of(2, 4),
			Contract.of(1, 5),
			Contract.of(2, 5),
			Contract.of(1, 6));

	public TelefunkenGame(List<IPlayer> players) {
		this.players = players;
		this.deck = Deck.standardDeckWithJokers(NUM_DECKS);
		this.buyCount = players.stream().collect(Collectors.toMap(Function.identity(), p -> INITIAL_BUY));
	}

	public void start() {
		// determine the dealer
		Random r = new Random();
		final int dealer = r.nextInt(players.size());

		while(roundNumber < contracts.size()) {
			TelefunkenRound round = new TelefunkenRound(this, contracts.get(roundNumber), deck, players, dealer);
			round.start();
		}
	}
}
