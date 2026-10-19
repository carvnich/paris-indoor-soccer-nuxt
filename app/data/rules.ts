// Rules per league slug. A block is a paragraph (string) or a numbered list (string[]). A league without an entry shows "No rules yet"; to add one, add its slug here.
export type RuleSection = { heading: string; blocks: (string | string[])[] };

export const rules: Record<string, RuleSection[]> = {
	"friday-coed": [
		{
			heading: "League mandate, mission statement",
			blocks: [
				[
					"The objective of the league is to provide registered players with an organized structured soccer environment, promoting fun, fitness, and friendly competition.",
					"To develop and encourage sportsmanship, community spirit, and good fellowship among all players to the betterment of their physical, mental and social well-being, regardless of their skill/or fitness level.",
					"To establish a league which enables adult men and women to enjoy playing the game of soccer for recreation-safely and free from harassment",
				],
			],
		},
		{
			heading: "Overview",
			blocks: [
				[
					"This league was set up for the individuals who want to play this game for fun, recreation, and acceptable competitiveness. If you cannot follow our simple rules, and or conduct yourself in a respectful manner towards Executives, fellow players, game officials, facility representatives, and or visitors/family members- then this league is not for you.",
					"There is a zero tolerance policy for foul & abusive language against any game official, convenor, fellow player, facility representatives or spectators. Violent conduct, excessive foul language and racial slurs will not be tolerated and, will be subject to suspended playing privileges.",
				],
			],
		},
		{
			heading: "Alcohol and drugs",
			blocks: [
				[
					"Open liquor in a public, non-licensed area, is a violation of the provincial act in Ontario. As is operating a vehicle under the influence of liquor.",
					"The County of Brant does not allow consumption of alcohol anywhere on their Syl Apps property (in dressing rooms, in parking lots etc.). Not adhering to County policies may result in the league being banned from the premises. Should teams be found to be in contravention of these rules, a warning and possible suspension or expulsion from the league may be issued in consideration of other teams and players that abide by the rules.",
				],
			],
		},
		{
			heading: "Violent conduct",
			blocks: [
				[
					"The league does not condone any form of violent conduct on the field or off the field directed at any Convenor, Ref, player, spectator, or facility employee.",
					"This shall be defined as any incident that puts the above mentioned in any serious risk of danger.",
					"Any player deemed to have acted in a violent manner shall receive disciplinary action which may include suspension or expulsion from the league, County facilities, fines and court action by the police;",
					"Any player receiving a violent conduct ejection must leave the facility immediately;",
					"Players suspended more than once for violent conduct will be expelled from the league.",
					"Any violent conduct deemed as a malicious attempt to deliberately seriously injure a player will not be tolerated and result in an automatic expulsion from the league.",
					"Decisions on suspensions for violent conduct will be made by the league convenor after reviewing all pertinent information received from the officiating referee, County staff, team captains and players involved in the altercation. Decisions on rulings by the league convenor are final.",
				],
			],
		},
		{ heading: "Spectators", blocks: [["Spectators must view the games from designated spectator viewing areas. No spectators are allowed on the player benches or in the dressing rooms."]] },
		{
			heading: "Playing rules",
			blocks: [
				[
					"Only registered players can play; Registration will be closed after the first round of round robin, or after the 5th game which ever comes first. Rosters will be submitted by Nov 15th with pictures of each player.",
					"The maximum number of players on the field at any time including the goalkeeper is six (6);",
					"Teams not being able to field at least 4 players on the field plus a goalkeeper shall forfeit their points for that game;",
					"Teams cannot borrow players from other teams during playoffs;",
					"Injured players or players that have not shown up for at least three consecutive games can be replaced by applying to the league convenor in writing. All roster changes must be approved by the league Convenor. Players must have played at least 5 regular season games to be eligible to play in the playoffs. Teams that cannot meet the above requirements will be given losses for their playoff games;",
					"All teams shall have a minimum of two (2) female players registered on the team. At least one (1) female must be on the field at all times. Should there be no female player available for a game, the team will play short;",
					"During regular season play, players may be borrowed from other teams for a game to provide a maximum of two male (2) plus one (1) female substitutes on the bench; Each gender is considered its own for the sub rules ie. If you have 3 male subs but no female you may still borrow a female. Goalies may also be borrowed if the team is missing a goalie. If the sub rules are broken the game will result in a forfeit.",
					"Referees shall officiate games according to FIFA and OSA rules. Referee calls and issuing of yellow and red cards against players shall be final;",
					"Receiving a red card will be an automatic one game player suspension. Receiving two red cards in a playing season will result in a 6 to 10 game suspension. Three red cards will result in suspension for the season and a review of the player’s ability to play in the league again.",
					"Three (3) points will be awarded for a win, one (1) point for a tie and zero (0) points for a loss;",
					"Should two teams be tied at the end of the regular season, the team with the best head to head then best goal differnece then goals for will be awarded the league regular season championship;",
					"Playoff games ending in a tie will be decided by penalty kicks. Each team will have five (5) shooters, one (1) of which must be a female. Female must be one of the first three shooters. If teams are still tied after five shooters, penalty kicks will continue to sudden death with the same five (5) players shooting again in the same order;",
					"Game statistics will be posted by the league Convenor on the Facebook page at the end of each week;",
					"Games cancelled due to weather will not be rescheduled;",
					"If the referee deems a ball to be out of bounds on the sidelines, play will be stopped and restarted with kick-ins;",
					"If a goalkeeper leaves his or her crease they will be just like any other player on the field;",
					"Goalkeepers can take penalty kicks",
					"Players must be over 21 years of age to play. There may be exceptions at the discretion of the convenor and agreement of at least 2/3 of the captains",
				],
			],
		},
		{
			heading: "Appendix A: Player conduct policy",
			blocks: [
				"Non-Violent Conduct: Any incident that does not put another player in any serious risk of danger. Defined as bumping, pushing or any verbal abuse towards another player or league official. Determination and ruling is made by game official and will follow the league’s disciplinary guidelines.",
				"Violent Conduct: Any incident that puts another player or league official in serious risk of danger. Defined as punching or swinging (contact or not), kicking in a dangerous manner, head-butting, biting, spitting, racial slurs and any over abusive foul language. Determination and ruling is made by the game official, and further enforcement may involve input from the league convenor.",
				"First offence: Red card (1 game suspension) and further suspension according to FIFA and OSA rules to be assessed by the league convenor.",
				"Second offence in same season: Red card, league suspension and life-time ban.",
			],
		},
		{
			heading: "Appendix B: Inappropriate behaviours and activities policy",
			blocks: [
				"Behaviour and activities that obstruct or hinder the rights of others to use and enjoy County facilities or compromises the safety of others is unacceptable and prohibited.",
				"Inappropriate behaviour and activities for the purpose of this policy includes, but is not limited to, the following:",
				[
					"Aggressive or intimidating verbal assaults;",
					"Threats and/or attempts to intimidate;",
					"Deliberate throwing of articles in an aggressive disruptive manner;",
					"Actual or attempted physical assaults of another person;",
					"Attempts to goad or incite violence in others;",
					"Theft of property;",
					"Possession of weapons;",
					"Vandalism to buildings, structures or property owned or leased through PSC;",
					"Intoxication, being under the influence of alcohol or drugs;",
					"Conduct that is known to be unwelcome as defined by the Ontario Human Rights Code. This may include the wearing of attire, the displaying of material or the use of language that is intolerant of human rights;",
					"Use of profanity or obscene language in contravention of City by-laws or policies;",
					"Causing unsanitary conditions (i.e. chewing tobacco, expulsion of bodily fluids, urinating etc.);",
					"Blocking thoroughfares/corridors/stairways/exits;",
					"Engaging in horseplay or sexual activity;",
					"The use of all cell phones, cameras, pda’s and all electronic equipment with photographic abilities in change rooms and public washrooms",
				],
			],
		},
		{
			heading: "Enforcement options",
			blocks: [
				"County’s primary responsibility is our duty of care to patrons and staff. If at any time patrons or staff feel personally threatened, they are to call the Police immediately. It is NOT the expectation that staff or patrons put themselves at risk or jeopardize their safety in dealing with any perceived or real threatening situation.",
				"In accordance with the Occupiers Liability Act, the Occupational Health and Safety Act, the Trespass to Property Act, the Criminal Code and other Provincial Legislation, staff are authorized to provide enforcement options if inappropriate behaviours or activities are observed or reported.",
			],
		},
		{
			heading: "Enforcement protocol",
			blocks: [
				[
					"Individuals who engage in any inappropriate behaviour, as defined in this policy, may, depending on the severity, be served with a trespass notice. In the event of a trespass notice being served for inappropriate behaviour, the final terms of the notice will be determined by the County.",
					"Appropriate staff in facilities and or geographic areas will be notified of individuals who have received a notice of trespass from County properties, facilities and programs.",
					"Incidents will be reported to the Ontario Provincial Police if deemed necessary, and charges may follow.",
				],
				"Upon witnessing or receiving a report on inappropriate behaviours; enact the following procedures and contact the police immediately;",
				[
					"Access situation; seek input/support from other staff and league convenor.",
					"Ask individual(s) to cease inappropriate behavior.",
					"Inform individual(s) that they will be asked to leave if inappropriate behaviour does not cease.",
					"If behaviour has not ceased – inform individual(s) to leave or police will be called.",
					"Call Police and Serve a trespass notice as deemed warranted.",
					"Advise the league convenor immediately.",
					"Prepare incident report including; activity, action taken, identification of offender, including name, phone number and address, date, location and time. Ensure copy of report goes to the league convenor. Include any video/still pictures to document incident and/or damages.",
				],
			],
		},
	],
};
