// 不同棋子相同项目有不同值时，采用一个数组，分别储存每一个棋子的相应值
// 代码中的表示玩家的变量"player"从零开始递增，代表不同玩家

const CONST = {
	Color: {
		Board_BG: '#CC9966', //F3F3F3
		Chess_Border: ['#AAAAAA', '#AAAAAA'],
		Chess: ['#000000', '#FFFFFF'],
		Chess_Border_Preview: ['#AAAAAAA8', '#AAAAAAA8'],
		Chess_Preview: ['#000000A8', '#FFFFFFA8'],
		Chess_Marker: ['#3399FF', '#3399FF'],
		Bomb: [
			'rgb(0, 0, 0)',
			'rgb(68, 0, 0)',
			'rgb(119, 0, 0)',
			'rgb(170, 0, 0)',
			'rgb(170, 0, 51)',
			'rgb(170, 0, 119)',
			'rgb(170, 0, 187)',
			'rgb(170, 0, 255)',
		]
	},

	Text: {
		BtnNewGame:  {default: '新的一局'},
		BtnStepback: {default: '悔棋一步'},
		BtnGameEnd:  {default: '点目'},
		BtnJudge:    {default: '形势判断', reset: '返回游戏'}
	},

	Number: {
		Judger_Width: 0.4,
		Marker_Width: 0.3
	}
}