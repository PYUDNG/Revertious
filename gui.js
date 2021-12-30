/*
	Revertious GUI Handler
	Args:
		Revertious
		detail
	Uses:
		Revertious.Config
		Revertious.Data
	Owns:
		.Elements
	Provides:
		.init()      : Create a blank canvas and init GUI
		.makeBoard() : Configure and draw a new gameboard on the existing canvas
		.redraw()    : Erase all image the canvas and redraw all content
		               according to the current game data
*/

function RevertiousGUI(RT, detail={
	gridWidth: 100,   // px per block
	padding: 50,      // padding width
	lineWidth: 3      // stroke line width
}) {
	const GUI = this;
	const Config = RT.Config;
	GUI.initialized = false;

	// Game Init
	GUI.init = function() {
		if (GUI.initialized) {return false;}

		// Init Game Data Structure
		const Elms = GUI.Elements = {};

		// Make Elements centered
		document.body.classList.add('center');
		// Create Game Container
		const container = Elms.container = document.createElement('div');
		container.classList.add('container');
		document.body.appendChild(container);

		// Create Game Board
		const cvs = Elms.cvs = document.createElement('canvas');
		const ctx = Elms.ctx = cvs.getContext('2d');
		container.appendChild(cvs);

		// Make new board
		GUI.makeBoard();

		// Create Control Panel
		const controPanel = Elms.controPanel = document.createElement('div');
		controPanel.classList.add('controlpanel');
		container.appendChild(controPanel);

		// Create Control Buttons
		const btnNewGame  = Elms.btnNewGame  = createControlBtn();
		const btnStepback = Elms.btnStepback = createControlBtn();
		const btnGameEnd  = Elms.btnGameEnd  = createControlBtn();
		const btnJudge    = Elms.btnJudge    = createControlBtn();
		btnNewGame .button.innerText = CONST.Text.BtnNewGame.default;
		btnStepback.button.innerText = CONST.Text.BtnStepback.default;
		btnGameEnd .button.innerText = CONST.Text.BtnGameEnd.default;
		btnJudge   .button.innerText = CONST.Text.BtnJudge.default;
		btnNewGame .button.addEventListener('click', btnFunc(RT.startGame));
		btnStepback.button.addEventListener('click', btnFunc(RT.stepBack));
		btnGameEnd .button.addEventListener('click', btnFunc(RT.finalJudge));
		btnJudge   .button.addEventListener('click', btnFunc(RT.tempJudge));
		controPanel.appendChild(btnNewGame .container);
		controPanel.appendChild(btnStepback.container);
		controPanel.appendChild(btnGameEnd .container);
		controPanel.appendChild(btnJudge   .container);

		// key bindings
		window.addEventListener('keydown', keyEvent);

		// Initialize finish
		GUI.initialized = true;
		return true;

		function createControlBtn() {
			const btnCtnr = document.createElement('div');
			const btn = document.createElement('div');
			btnCtnr.classList.add('center');
			btn.classList.add('btn');
			btn.classList.add('noselect');
			btnCtnr.appendChild(btn);
			return {
				container: btnCtnr,
				button: btn
			};
		}

		function btnFunc(f) {
			return function(e) {
				const button = e.currentTarget;
				if (!button.className.split(' ').includes('disabled')) {
					return f(e);
				}
			}
		}

		function keyEvent(e) {
			if (!e) {return false;}
			const newGame  = e.key === 'n' && e.ctrlKey;
			const stepBack = e.key === 'z' && e.ctrlKey;

			newGame && RT.startGame();
			stepBack && RT.readHistroy(-1);
		}
	}

	// Calculate {left,top,midx,midy,right,bottom,cleft,ctop,cright,cbottom} position of given (x, y) block
	GUI.calcPos = function(x, y) {
		const standardx = detail.padding + detail.gridWidth * x;
		const standardy = detail.padding + detail.gridWidth * y;
		return {
			left:    standardx,
			top:     standardy,
			midx:    standardx + detail.gridWidth * 0.5,
			midy:    standardy + detail.gridWidth * 0.5,
			right:   standardx + detail.gridWidth * 1.0,
			bottom:  standardy + detail.gridWidth * 1.0,
			cleft:   standardx + detail.gridWidth * 0.1,
			ctop:    standardy + detail.gridWidth * 0.1,
			cright:  standardx + detail.gridWidth * 0.9,
			cbottom: standardy + detail.gridWidth * 0.9,
		}
	}

	GUI.mouseToPos = function(mousex, mousey) {
		return {
			x: Math.max(Math.min(Math.floor((mousex - Config.padding) / Config.gridWidth), Config.boardsize-1), 0),
			y: Math.max(Math.min(Math.floor((mousey - Config.padding) / Config.gridWidth), Config.boardsize-1), 0)
		}
	}

	// Draw a new board on the existing canvas (Clears the existing content)
	GUI.makeBoard = function() {
		const Data = RT.Data;

		// Get Arguments
		const Elms = GUI.Elements;
		const cvs = Elms.cvs;
		const ctx = Elms.ctx;
		const boardsize  = Config.boardsize;
		const gridWidth  = detail.gridWidth;
		const padding    = detail.padding;
		const lineWidth  = detail.lineWidth;
		const boardwidth = boardsize * gridWidth + padding * 2

		// Adjust Game Board
		Config.gridWidth  = gridWidth;
		Config.boardsize  = boardsize;
		Config.boardwidth = boardwidth;
		Config.padding    = padding;
		Config.lineWidth  = lineWidth
		cvs.width = cvs.height = boardwidth;
		ctx.lineWidth = lineWidth;

		// Fill background color
		ctx.fillStyle = CONST.Color.Board_BG;
		ctx.fillRect(0, 0, boardwidth, boardwidth);

		// Draw lines
		ctx.beginPath();
		for (let x = padding; x <= boardwidth - padding; x += gridWidth) {
			ctx.moveTo(x, padding);
			ctx.lineTo(x, boardwidth - padding);
		}
		for (let y = padding; y <= boardwidth - padding; y += gridWidth) {
			ctx.moveTo(padding, y);
			ctx.lineTo(boardwidth - padding, y);
		}
		ctx.closePath();
		ctx.stroke();

		// Events
		eMouseover();
		eClick();

		// Provide mouse moveover effect
		function eMouseover() {
			let lastPos;
			cvs.onmousemove = onmouseover;
			cvs.onmouseout = onmouseout;
			//cvs.addEventListener('mouseover', onmouseover);
			//cvs.addEventListener('mouseout', onmouseout);

			function onmouseover(e) {
				if (!RT.gaming || RT.onJudge) {return false;}

				const pos = GUI.mouseToPos(e.offsetX, e.offsetY);
				if (!RT.PosAvailable(pos.x, pos.y, true, RT.nextPlayer)) {return false;}

				lastPos && Data[lastPos.x][lastPos.y].type === 'empty' && GUI.eraseone(lastPos.x, lastPos.y);
				GUI.drawpreview(pos.x, pos.y, RT.nextPlayer);
				Data[pos.x][pos.y].type === 'empty' && (lastPos = pos);
			}

			function onmouseout(e) {
				if (!RT.gaming || RT.onJudge) {return false;}
				
				if (!lastPos || !RT.PosAvailable(lastPos.x, lastPos.y, true)) {return false;}
				GUI.eraseone(lastPos.x, lastPos.y);
				lastPos = null;
			}
		}

		// Go when onclick
		function eClick() {
			cvs.onclick = onclick;

			function onclick(e) {
				const pos = GUI.mouseToPos(e.offsetX, e.offsetY);
				
				if (!RT.PosAvailable(pos.x, pos.y, true)) {return false;}
				RT.downChess(pos.x, pos.y, RT.nextPlayer);
			}
		}
	}

	// Erase a block
	GUI.eraseone = function(x, y) {
		if (!RT.PosAvailable(x, y)) {return false;}

		const Elms = GUI.Elements;
		const cvs = Elms.cvs;
		const ctx = Elms.ctx;
		const position = GUI.calcPos(x, y);
		ctx.fillStyle = CONST.Color.Board_BG;
		ctx.fillRect(position.left+Config.lineWidth, position.top+Config.lineWidth, Config.gridWidth-Config.lineWidth*2, Config.gridWidth-Config.lineWidth*2);
	}

	// Draw a chess
	GUI.drawItem = function(details) {//x, y, type, content
		// Get arguments
		const x = details.x;
		const y = details.y;
		const type = details.type;
		const content = details.content;
		const args = details.args || [];

		// Draw
		const Drawer = {
			'chess': GUI.drawChess,
			'bomb':  GUI.drawBomb,
			'empty': function() {}
		}
		return Drawer[type].apply(null, [x, y, content].concat(args));
	}

	// Draw a chess
	GUI.drawChess = function(x, y, player, marker=false) {
		if (!RT.PosAvailable(x, y)) {return false;}

		const Elms = GUI.Elements;
		const cvs = Elms.cvs;
		const ctx = Elms.ctx;
		const position = GUI.calcPos(x, y);
		GUI.eraseone(x, y);
		ctx.beginPath();
		ctx.arc(position.midx, position.midy, Config.gridWidth*0.8/2, 0, Math.PI*2);
		ctx.fillStyle = CONST.Color.Chess[player];
		ctx.fill();
		ctx.strokeStyle = CONST.Color.Chess_Border[player];
		ctx.stroke();
		ctx.closePath();

		if (marker) {
			GUI.drawMarker(x, y, player);
		}
	}

	GUI.drawMarker = function(x, y, player) {
		const Elms = GUI.Elements;
		const cvs = Elms.cvs;
		const ctx = Elms.ctx;
		const position = GUI.calcPos(x, y);
		const width = Config.gridWidth * CONST.Number.Marker_Width;
		const padding = (Config.gridWidth - width) / 2;
		ctx.fillStyle = CONST.Color.Chess_Marker[player];
		ctx.fillRect(position.left + padding, position.top + padding, width, width);
	}

	GUI.clearMarker = function(x, y, player) {
		const Elms = GUI.Elements;
		const cvs = Elms.cvs;
		const ctx = Elms.ctx;
		const position = GUI.calcPos(x, y);
		const width = Config.gridWidth * CONST.Number.Marker_Width + 2;
		const padding = (Config.gridWidth - width) / 2;
		ctx.fillStyle = RT.Data[x][y].type === 'chess' ? CONST.Color.Chess[player] : CONST.Color.Board_BG;
		ctx.fillRect(position.left + padding, position.top + padding, width, width);
	}

	// Draw a bomb
	GUI.drawBomb = function(x, y, index) {
		const Elms = GUI.Elements;
		const cvs = Elms.cvs;
		const ctx = Elms.ctx;
		const position = GUI.calcPos(x, y);

		// Clear previous block content
		GUI.eraseone(x, y);

		// Calculate width
		const squareWidth = Config.gridWidth - Config.lineWidth * 2 - (Config.gridWidth - Config.lineWidth) * 0.2;
		const textWidth = squareWidth * 0.8;

		// Stroke square
		ctx.strokeStyle = CONST.Color.Bomb[index];
		ctx.strokeRect(
			position.left + Config.lineWidth + (Config.gridWidth - Config.lineWidth) * 0.1,
			position.top  + Config.lineWidth + (Config.gridWidth - Config.lineWidth) * 0.1,
			squareWidth,
			squareWidth
		);

		// Write number
		const text = (index+1).toString()
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.font = (Math.floor(textWidth / text.length)).toString() + 'px sans-serif';
		ctx.fillStyle = CONST.Color.Bomb[index];
		ctx.fillText(text, position.midx, position.midy, textWidth);
	}

	// Draw a preview chess
	GUI.drawpreview = function(x, y, player) {
		if (!RT.PosAvailable(x, y)) {return false;}

		const Elms = GUI.Elements;
		const cvs = Elms.cvs;
		const ctx = Elms.ctx;
		const position = GUI.calcPos(x, y);
		GUI.eraseone(x, y);
		ctx.beginPath();
		ctx.arc(position.midx, position.midy, Config.gridWidth*0.8/2, 0, Math.PI*2);
		ctx.fillStyle = CONST.Color.Chess_Preview[player];
		ctx.fill();
		ctx.strokeStyle = CONST.Color.Chess_Border_Preview[player];
		ctx.stroke();
		ctx.closePath();
	}

	// Draw a judger
	GUI.drawJudger = function(x, y, player) {
		if (!RT.PosAvailable(x, y)) {return false;}

		const Elms = GUI.Elements;
		const cvs = Elms.cvs;
		const ctx = Elms.ctx;
		const position = GUI.calcPos(x, y);
		const width = Config.gridWidth * CONST.Number.Judger_Width;
		const fullwidth = position.right - position.left;
		const padding = (fullwidth - width) / 2
		GUI.eraseone(x, y);
		ctx.fillStyle = CONST.Color.Chess[player];
		ctx.fillRect(
			position.left + padding,
			position.top + padding,
			width,
			width
		);
		ctx.strokeStyle = CONST.Color.Chess_Border[player];
		ctx.strokeRect(
			position.left + padding,
			position.top + padding,
			width,
			width
		);
	}

	// Redraw all on the game board
	GUI.drawAll = function() {
		const Data = RT.Data;

		// Clear all
		GUI.makeBoard();

		// draw
		for (let x = 0; x < Config.boardsize; x++) {
			for (let y = 0; y < Config.boardsize; y++) {
				const block = Data[x][y];
				const item = {x: x, y: y, type: block.type, content: block.number};
				RT.latest.x === x && RT.latest.y === y && (item.args = [true]);
				GUI.drawItem(item);
			}
		}
	}
}