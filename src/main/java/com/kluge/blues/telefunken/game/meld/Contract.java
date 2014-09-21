/**
 *
 */
package com.kluge.blues.telefunken.game.meld;

import java.util.Arrays;
import java.util.List;

/**
 * This defines the contract for a given round of Telefunken
 * The contract is always a set(s) of different sizes. Increasing in difficulty with each round
 *
 * @author <a href="mailto:roland.kluge@gmail.com">roland</a>
 * @since Sep 20, 2014
 */
public class Contract {
	private final int numSets;
	private final int sizeOfSets;

	private Contract(int numSets, int sizeOfSets) {
		super();
		this.numSets = numSets;
		this.sizeOfSets = sizeOfSets;
	}

	public static Contract of(int numSets, int sizeOfSets) {
		return new Contract(numSets, sizeOfSets);
	}

	public boolean validate(List<Meld> melds) {
		if(melds.size() != numSets) {
			return false;
		}

		// I hate to use instanceof, but I don't want to create a MeldVisitor just yet
		// and I am not a fan of having isSet, isRun on the interface
		// nor returning the an enum called MeldType
		return melds.stream().allMatch(m -> m instanceof SetMeld && m.size() == sizeOfSets);
	}
}
