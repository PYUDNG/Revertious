/*
	Revertious Game Main
	Args:
		None
	Uses:
		None
	Owns:
		.Config
		.Data * 0, 1, 2... stand for chesses, -1, -2... stand for special contents
		.GUI
		.History
*/

function Revertious(detail={
	boardsize: 8,     // blocks per line/row
	gridWidth: -1,    // px per block, -1 for auto
	padding: -1,      // padding width, -1 for auto
	lineWidth: 3      // stroke line width
}) {
	const RT = this;
	RT.initialized = false;

	let boardsize, gridWidth, padding, lineWidth;

	// Game Init
	RT.init = function() {
		if (RT.initialized) {return false;}

		// Get Args
		boardsize = detail.boardsize;
		gridWidth = detail.gridWidth;
		padding   = detail.padding;
		lineWidth = detail.lineWidth;
		gridWidth <= 0 && (gridWidth = Math.floor(Math.min(Math.max(window.innerWidth, window.innerHeight)/4*3, Math.min(window.innerWidth, window.innerHeight)) / (boardsize+1)));
		padding <= 0 && (padding = Math.floor(gridWidth / 2));

		// Init
		RT.Config = {
			boardsize: boardsize,
			playerCount: 2
		};
		RT.gaming = false;
		RT.initialized = true;
		RT.startGame();
		return true;
	}

	// New Game
	RT.startGame = function() {
		RT.Data = initData(RT.Data);
		RT.nextPlayer = 0;
		RT.History = [];
		RT.latest = {};
		RT.GUI = RT.GUI || new RevertiousGUI(RT, {
			gridWidth: gridWidth,
			padding:   padding,
			lineWidth: lineWidth
		});
		RT.GUI.init();
		RT.GUI.makeBoard();
		makeInitialChess();
		randomBomb();
		RT.gaming = true;
		RT.onJudge = false;
		const Elms = RT.GUI.Elements;
		[Elms.btnNewGame.button, Elms.btnStepback.button, Elms.btnGameEnd.button, Elms.btnJudge.button].forEach((btn) => {
			btn.classList.remove('disabled');
		})

		function initData(data) {
			const emptyBlock = RT.emptyBlock = {
				type: 'empty',
				number: -1
			};
			const Data = data || [];
			for (let x = 0; x < boardsize; x++) {
				Data[x] = [];
				for (let y = 0; y < boardsize; y++) {
					Data[x][y] = emptyBlock;
				}
			}
			return Data;
		}

		function makeInitialChess() {
			RT.setBlock({x: 0, y: 0, type: 'chess', content: 0});
			RT.setBlock({x: boardsize-1, y: boardsize-1, type: 'chess', content: 1});
			//RT.setBlock((boardsize-1)/2, (boardsize-1)/2, 'bomb', 7);
		}

		// Generate bombs randomly on current gameboard.
		// Number of bomb is between (availableBombPositions*minRate, availableBombPositions*maxRate)
		// Existing chesses' surrounding-blocks within safedistance will not generate bombs
		function randomBomb(minRate=0.125, maxRate=0.175, safedistance=2) {
			const Data = RT.Data;
			const posos = getBombPoses(safedistance);
			const count = randint(Math.round(posos.length*minRate), Math.round(posos.length*maxRate));
			for (let i = 0; i < count; i++) {
				rand1Bomb(posos);
			}

			function rand1Bomb(posos) {
				const i = randint(0, posos.length-1);
				const n = randint(0, 7);
				const pos = posos[i];
				delItem(posos, i);
				RT.setBlock({x: pos.x, y: pos.y, type: 'bomb', content: n});
			}

			function getBombPoses(d) {
				let x, y;

				// Init bombmap
				const bombmap = [];
				for (x = 0; x < boardsize; x++) {
					bombmap[x] = [];
					for (y = 0; y < boardsize; y++) {
						bombmap[x][y] = true;
					}
				}

				// Disable chess surroundings
				for (x = 0; x < boardsize; x++) {
					for (y = 0; y < boardsize; y++) {
						if (Data[x][y].type === 'chess') {
							disableSurroundings(x, y, d);
						}
					}
				}

				// Get available positions
				const posos = [];
				for (x = 0; x < boardsize; x++) {
					for (y = 0; y < boardsize; y++) {
						if (bombmap[x][y]) {
							posos.push({x: x, y: y});
						}
					}
				}
				return posos;

				// Disable positions around chesses
				function disableSurroundings(x, y, d=2) {
					const min = RT.getPosInBoard(x-d, y-d);
					const max = RT.getPosInBoard(x+d, y+d);

					for (let x = min.x; x <= max.x; x++) {
						for (let y = min.y; y <= max.y; y++) {
							bombmap[x][y] = false;
						}
					}
				}
			}
		}
	}

	// Go
	RT.downChess = function(x, y, player) {
		if (!RT.PosAvailable(x, y, true, player)) {return false;}

		// Clear last chess' mark
		RT.History.length > 0 && RT.GUI.clearMarker(RT.latest.x, RT.latest.y, RT.latest.player);

		// Place chess
		RT.setBlock({
			x: x,
			y: y,
			type: 'chess',
			content: player,
			args: [true]
		});
		RT.latest = {x: x, y: y, player: player}

		// Reverse!
		RT.reverse(x, y, player);

		// Bomb!
		RT.bomb();

		// Next player
		RT.nextPlayer++;
		RT.nextPlayer === RT.Config.playerCount && (RT.nextPlayer = 0);

		// Save history
		RT.saveHistory();
	}

	// Set block content both in memory and on board
	RT.setBlock = function(details) {
		if (details.x === undefined || details.y === undefined || details.content === undefined) {return false;}

		// Get arguments
		const x = details.x;
		const y = details.y;
		const type = details.type || 'chess';
		const content = details.content;
		const args = details.args || [];

		// Set in memory
		const Data = RT.Data;
		Data[x][y] = {type: type, number: content};

		// Set in screen
		RT.GUI.drawItem(details);

		return true;
	}

	// Reverse!
	RT.reverse = function(x, y, player) {
		const Config = RT.Config;
		for (let dx = -1; dx <= 1; dx++) {
			for (let dy = -1; dy <= 1; dy++) {
				const cx = x + dx;
				const cy = y + dy;

				if (cx < 0 || cx >= Config.boardsize || cy < 0 || cy >= Config.boardsize) {
					continue;
				}
				if (RT.Data[cx][cy].type === 'chess' && RT.Data[cx][cy].number !== player) {
					RT.setBlock({x: cx, y: cy, type: 'chess', content: player});
				}
			}
		}
	}

	// Check bombs activation
	RT.bomb = function() {
		const Data = RT.Data;
		const Config = RT.Config;
		const GUI = RT.GUI;
		for (let x = 0; x < Config.boardsize; x++) {
			for (let y = 0; y < Config.boardsize; y++) {
				const block = Data[x][y];
				if (block.type === 'bomb') {
					checkBomb(x, y, block.number).activate && boom(x, y);
				}
			}
		}

		function checkBomb(x, y, number) {
			const min = RT.getPosInBoard(x-1, y-1);
			const max = RT.getPosInBoard(x+1, y+1);

			let num = -1;
			for (let cx = min.x; cx <= max.x; cx++) {
				for (let cy = min.y; cy <= max.y; cy++) {
					if (Data[cx][cy].type === 'chess') {
						num++;
					}
				}
			}

			return {
				activate: num >= number,
				rest: number - num,
				num: num
			}
		}

		function boom(x, y) {
			// Remove current bomb first
			Data[x][y] = RT.emptyBlock;
			GUI.eraseone(x, y);

			// Find others
			const min = RT.getPosInBoard(x-1, y-1);
			const max = RT.getPosInBoard(x+1, y+1);
			for (let cx = min.x; cx <= max.x; cx++) {
				for (let cy = min.y; cy <= max.y; cy++) {
					if (Data[cx][cy].type === 'chess') {
						// Clear chesses
						Data[cx][cy] = RT.emptyBlock;
						GUI.eraseone(cx, cy);
					} else if (Data[cx][cy].type === 'bomb') {
						// Activate other bombs
						boom(cx, cy);
					}
				}
			}
		}
	}

	RT.tempJudge = function() {
		const Elms = RT.GUI.Elements;
		const button = Elms.btnJudge.button;
		const Text = CONST.Text.BtnJudge;
		const restBtn = [Elms.btnNewGame.button, Elms.btnStepback.button, Elms.btnGameEnd.button];
		if (RT.onJudge) {
			RT.GUI.drawAll();
			button.innerText = Text.default;
			restBtn.forEach((btn) => {btn.classList.remove('disabled');});
		} else {
			RT.userJudge();
			button.innerText = Text.reset;
			restBtn.forEach((btn) => {btn.classList.add('disabled');});
		}
		RT.onJudge = !RT.onJudge;
	}

	RT.finalJudge = function() {
		const Elms = RT.GUI.Elements;
		RT.userJudge();
		RT.gaming = false;
		[Elms.btnStepback.button, Elms.btnGameEnd.button, Elms.btnJudge.button].forEach((btn) => {
			btn.classList.add('disabled');
		})
	}

	RT.userJudge = function() {
		const Config = RT.Config;
		const scoreMap = RT.Judge();
		for (let x = 0; x < Config.boardsize; x++) {
			for (let y = 0; y < Config.boardsize; y++) {
				RT.Data[x][y].type !== 'chess' && RT.GUI.eraseone(x, y);
				scoreMap[x][y] !== -1 && RT.Data[x][y].type !== 'chess' && RT.GUI.drawJudger(x, y, scoreMap[x][y]);
			}
		}
	}

	RT.Judge = function() {
		const Data = RT.Data;
		const scoreMap = [];
		for (let x = 0; x < boardsize; x++) {
			scoreMap[x] = [];
			for (let y = 0; y < boardsize; y++) {
				scoreMap[x][y] = JudgeBlock(x, y);
			}
		}

		function JudgeBlock(x, y) {
			if (Data[x][y].type === 'chess') {return Data[x][y].number;}

			const maxd = getmax(boardsize-1-x, x-0, boardsize-1-y, y-0);

			// Init chess counter
			let counter = [];
			for (let i = 0; i < RT.Config.playerCount; i++) {
				counter.push(0);
			}

			for (let d = 1; d <= maxd; d++) {
				const min = RT.getPosInBoard(x-d, y-d);
				const max = RT.getPosInBoard(x+d, y+d);

				// Count chesses
				for (let x = min.x; x <= max.x; x++) {
					for (let y = min.y; y <= max.y; y++) {
						const block = Data[x][y];
						if (block.type === 'chess') {
							counter[block.number]++;
						}
					}
				}

				// Judge
				const maxScore = getmax.apply(null, counter);
				const maxes = counter.filter((n)=>{return n === maxScore;});
				if (maxes.length === 1) {
					return counter.indexOf(maxScore);
				} else {
					counter = counter.map((n)=>(0));
				}
			}

			return -1;
		}
		return scoreMap;
	}

	RT.getPosInBoard = function(x, y) {
		const Config = RT.Config;
		switch(arguments.length) {
			case 1:
				return Math.max(Math.min(x, Config.boardsize-1), 0);
				break;
			case 2:
				return {
					x: Math.max(Math.min(x, Config.boardsize-1), 0),
					y: Math.max(Math.min(y, Config.boardsize-1), 0)
				}
		}
		
	}

	RT.saveHistory = function() {
		const History = RT.History;

		History.push({
			Data: JSON.stringify(RT.Data),
			nextPlayer: RT.nextPlayer,
			latest: JSON.stringify(RT.latest)
		})
	}

	RT.readHistroy = function(num) {
		// Read
		const History = RT.History;
		const index = num >= 0 ? num : History.length-1+num;
		const data = History[index];
		if (index < 0) {return false;}

		// Recover
		//deepSet(data.Data, RT.Data);
		RT.Data = JSON.parse(data.Data);
		RT.nextPlayer = data.nextPlayer;
		RT.latest = JSON.parse(data.latest);

		// Delete all 'Futures'
		RT.History = RT.History.slice(0, index+1);

		// Paint
		RT.GUI.drawAll();

		return true;
	}

	RT.stepBack = function() {
		RT.readHistroy(-1);
	}

	// Check whether a position is available.
	// Checks whether x, y is inside the chessboard
	// Checks whether Data[x][y] not exist
	// Checks whether player is allowed to go at Data[x][y] if player argv is given
	RT.PosAvailable = function(x, y, checkdata=false, player=null) {
		return (x >= 0 && x < boardsize && y >= 0 && y < boardsize) && (!checkdata || RT.Data[x][y].type === 'empty') && (player === null || nextToAnother(x, y, player));

		function nextToAnother(x, y, player) {
			const Data = RT.Data;
			const Config = RT.Config;
			for (let d = -1; d <= 1; d++) {
				const cx = x + d;
				const cy = y + d;

				if ((cx >= 0 && cx < Config.boardsize) && Data[cx][y].type === 'chess' && Data[cx][y].number === player) {return true;}
				if ((cy >= 0 && cy < Config.boardsize) && Data[x][cy].type === 'chess' && Data[x][cy].number === player) {return true;}
			}
			return false;
		}
	}

	function randint(n, m) {
		return Math.floor(Math.random()*(m-n+1)+n)
	}

	// Del a item from an array using its index. Returns the array but can NOT modify the original array directly!!
	function delItem(arr, delIndex) {
		arr = arr.slice(0, delIndex).concat(arr.slice(delIndex+1));
		return arr;
	}

	function getmin() {
		if (arguments.length === 0) {return null;}
		if (arguments.length === 1) {return arguments[0]}
		let min = arguments[0];
		for (let i = 1; i < arguments.length; i++) {
			min = Math.min(min, arguments[i]);
		}
		return min;
	}

	function getmax() {
		if (arguments.length === 0) {return null;}
		if (arguments.length === 1) {return arguments[0]}
		let max = arguments[0];
		for (let i = 1; i < arguments.length; i++) {
			max = Math.max(max, arguments[i]);
		}
		return max;
	}
}