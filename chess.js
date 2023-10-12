class Chess{
    Pieces = {
        R: {name: 'rook', value: 5, url: style=>`/static/pieces/${style}/wr.png`,player:'white',moves: [[1, 0], [-1, 0], [0, 1], [0, -1]],one_move: false},
        r: {name: 'rook', value: 5, url: style=>`/static/pieces/${style}/br.png`,player:'black',moves: [[1, 0], [-1, 0], [0, 1], [0, -1]],one_move: false},
        B: {name: 'bishop', value: 3, url: style=>`/static/pieces/${style}/wb.png`,player:'white',moves: [[1, 1], [1, -1], [-1, 1], [-1, -1]],one_move: false},
        b: {name: 'bishop', value: 3, url: style=>`/static/pieces/${style}/bb.png`,player:'black',moves: [[1, 1], [1, -1], [-1, 1], [-1, -1]],one_move: false},
        N: {name: 'knight', value: 3, url: style=>`/static/pieces/${style}/wn.png`,player:'white',moves: [[2, 1], [1, 2], [-1, -2], [-2, -1], [-2, 1], [-1, 2], [2, -1], [1, -2]],one_move: true},
        n: {name: 'knight', value: 3, url: style=>`/static/pieces/${style}/bn.png`,player:'black',moves: [[2, 1], [1, 2], [-1, -2], [-2, -1], [-2, 1], [-1, 2], [2, -1], [1, -2]],one_move: true},
        Q: {name: 'queen', value: 9, url: style=>`/static/pieces/${style}/wq.png`,player:'white',moves: [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]],one_move: false},   
        q: {name: 'queen', value: 9, url: style=>`/static/pieces/${style}/bq.png`,player:'black',moves: [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]],one_move: false},
        K: {name: 'king', value: 0, url: style=>`/static/pieces/${style}/wk.png`,player:'white',moves: [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]],one_move: true}, 
        k: {name: 'king', value: 0, url: style=>`/static/pieces/${style}/bk.png`,player:'black',moves: [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]],one_move: true},
        P: {name: 'pawn', value: 1, url: style=>`/static/pieces/${style}/wp.png`,player:'white',},   
        p: {name: 'pawn', value: 1, url: style=>`/static/pieces/${style}/bp.png`,player:'black'}
        
    }
    constructor(white, black, time, timeBonus, play_with=0){
        this.canvas = null
        this.board = Array(64).fill(undefined)
        this.style='neo'
        this.color = ['#d07c44', '#f2e6d8']
        this.pieces = {}
        this.highlights = []
        this.canvas_highlights = []
        this.position = this.decodeFen("RNBQKBNR/PPPPPPPP/8/8/8/8/pppppppp/rnbqkbnr")
        this.history = [this.position]
        this.moves = []
        this.promoting = false
        this.over=false
        this.last_move = null
        this.time=time
        this.timeBonus = timeBonus
        this.play_with = play_with
        this.game = {
            'white': white,
            'black': black,
            'time': {
                'white': time*1000,
                'black': time*1000,
            },
            'captured':{
                'white': [],
                'black': [],
            }
        }
    }
    init(){
        let root = document.getElementById('root')
        root.innerHTML=''
        this.buildBoard(root)
        this.loadPieces()
    }
    start(){
        this.starTime()
        this.play()
    }
    starTime(){
        setInterval(()=>{
            if(!this.over){
                this.game.time[this.player]-=250
            if(this.game.time[this.player]<=0){
                clearInterval(this.starTime)
                this.game.time[this.player]=0
                this.endGame('timeout', this.player=='white'?'black':'white')
            }
            this.changeTime()
            }
        }, 250)
    }
    endGame(outcome, player=null){
        alert(outcome)
        this.over=true
    }
    loadPieces(){
        this.position.map((p, i)=>{
            if(p){
                this.addPiece(p, i)
            }
        })
    }
    movePiece(src, des){
        let file = des%8
        let rank = (des - des%8)/8
        this.pieces[src].style.top = `${100*(7-rank)}px`
        this.pieces[src].style.left = `${100*file}px`
    }
    deletePiece(index){
        this.pieces[index].remove()
        this.pieces.splice(index, index)
    }
    addPiece(piece, index){
        let piece_image = document.createElement('img')
        piece_image.setAttribute('src', this.Pieces[piece].url(this.style))
        piece_image.setAttribute('class', 'piece')
        piece_image.setAttribute('draggable', 'false')
        let file = index%8
        let rank = (index - index%8)/8
        piece_image.style.top = `${100*(7-rank)}px`
        piece_image.style.left = `${100*file}px`
        this.pieces[index] = piece_image
        this.canvas.appendChild(piece_image)
    }
    play(){
        this.player = 'white'
        this.selected = undefined
        this.being_moved=null
        this.ligal_moves = []
        // loop
        window.addEventListener('mousemove', e=>{
            if(!this.over && (this.play_with==0 || (this.play_with==1 && this.player=='white') || (this.play_with==-1 && this.player=='black'))){
                if(this.being_moved){
                    let clickX = e.clientX - this.canvas.getBoundingClientRect().x - 50
                    let clickY = e.clientY - this.canvas.getBoundingClientRect().y - 50
                    this.pieces[this.being_moved].style.left=`${clickX}px`
                    this.pieces[this.being_moved].style.top=`${clickY}px`
                }
            }
        })
        window.addEventListener('mouseup', e=>{
            if(!this.over && (this.play_with==0 || (this.play_with==1 && this.player=='white') || (this.play_with==-1 && this.player=='black'))){   
                    let clickX = e.clientX - this.canvas.getBoundingClientRect().x
                    let clickY = 800 - e.clientY + this.canvas.getBoundingClientRect().y
                    let X = Math.floor(clickX/100)
                    let Y = Math.floor(clickY/100)
                    let index = Y*8 + X
                    if (this.highlights.includes(index)){
                    this.makeMove(this.selected, index)
                }else{
                    if(this.being_moved){
                        let file = this.being_moved%8
                        let rank = (this.being_moved - this.being_moved%8)/8
                        this.pieces[this.being_moved].style.top = `${100*(7-rank)}px`
                        this.pieces[this.being_moved].style.left = `${100*file}px`
                    }
                }
                this.being_moved=null
            }
        })
        window.addEventListener('mousedown', e=>{
        if(!this.over && (this.play_with==0 || (this.play_with==1 && this.player=='white') || (this.play_with==-1 && this.player=='black'))){
            if(!this.promoting){
                let clickX = e.clientX - this.canvas.getBoundingClientRect().x
                let clickY = 800 - e.clientY + this.canvas.getBoundingClientRect().y
                let X = Math.floor(clickX/100)
                let Y = Math.floor(clickY/100)
                let index = Y*8 + X
                if(X<8 && X>=0 && Y<8 && Y>=0){
                    if(this.ligal_moves.map(i=>i[0]).includes(index)){
                        if(this.selected){
                            this.unhighlight()
                            this.highlights = []
                        }
                        this.selected=index
                        this.changeZIndex(index)
                        if(this.being_moved==null){
                            this.being_moved=index
                        }
                        this.highlight(this.selected)
                        // highwhite
                    }else if (this.highlights.includes(index)){
                        this.makeMove(this.selected, index)
    
                        
                    }else{
                        this.unhighlight()
                        this.selected = undefined
                        this.highlights = []
                    }
                    
                }else{
                    this.unhighlight()
                    this.selected = undefined
                    this.highlights = []
                }
                
                }
        }
        })
        this.ligal_moves = this.getLigalMoves(this.player)
    }
    makeMove(src, des){
        if((this.position[src]=='p' && des<=7) || this.position[src]=='P' && des>=56){
            this.promoting = true
            this.promote(src, des)
        }else{
            this.move(src, des)
            this.updatePiecesCaptured(this.player)
            this.updateScore('white')
            this.updateScore('black')
            this.player = this.player=='white'?'black':'white'
            this.ligal_moves = this.getLigalMoves(this.player)
            this.checkGame()
        }
        this.unhighlight()
        this.selected = undefined
        this.highlights = []
        if(this.player=='black')this.moveRandomly()
    }
    move(src, des){
        if(this.position[des]!=undefined){
            this.removePiece(des)
            this.game.captured[this.player].push(this.position[des])
        }
        if(((src==4 && des==6) || ((src==4 && des==2)) && this.position[4]=='K' )|| ((src==60 && des==58) || ((src==60 && des==62)) && this.position[60]=='k')){
            this.moves.push((src==4 && des==6)?'O-O':(src==4 && des==2)?'O-O-O':(src==60 && des==58)?'o-o':'o-o-o')
            // handling King
            this.movePiece(src, des)
            this.position[des] = this.position[src]
            this.position[src] = undefined
            // this.history.push(Object.assign([], this.position))
            this.pieces[des] = this.pieces[src]
            delete this.pieces[src]
            // handling rook
            let king_move = [src, des]
            let rook_move = king_move[0]==4&&king_move[1]==2?[0, 3]:king_move[0]==4&&king_move[1]==6?[7, 5]:king_move[0]==60&&king_move[1]==58?[56, 59]:[63, 61]
            this.movePiece(rook_move[0], rook_move[1])
            this.position[rook_move[1]] = this.position[rook_move[0]]
            this.position[rook_move[0]] = undefined
            this.history.push(Object.assign([], this.position))
            this.pieces[rook_move[1]] = this.pieces[rook_move[0]]
            delete this.pieces[rook_move[0]]
        }else if (['P', 'p'].includes(this.position[src]) && Math.abs(src-des)%8!=0 && this.empty(this.position, des)){
            this.moves.push([src, des])
            this.removePiece(des==src+7 || des==src-9?src-1:src+1)
            this.movePiece(src, des)
            this.position[des] = this.position[src]
            this.position[src] = undefined
            this.position[des==src+7 || des==src-9?src-1:src+1] = undefined
            this.pieces[des==src+7 || des==src-9?src-1:src+1] = undefined
            this.history.push(Object.assign([], this.position))
            this.pieces[des] = this.pieces[src]
            delete this.pieces[src]
        }else{
            this.moves.push([src, des])
            this.movePiece(src, des)
            this.position[des] = this.position[src]
            this.position[src] = undefined
            this.history.push(Object.assign([], this.position))
            this.pieces[des] = this.pieces[src]
            delete this.pieces[src]
        }
        this.highlightLastMove()
        this.highlightMove(src, des)
        this.game.time[this.player]+=this.timeBonus*1000
        
    }
    highlightLastMove(){
        if(this.last_move){
            this.toggleHighlight(this.last_move[0])
            this.toggleHighlight(this.last_move[1])
        }
    }
    highlightMove(src, des){
        this.last_move=[src, des]
        this.toggleHighlight(src)
        this.toggleHighlight(des)
    }
    toggleHighlight(id){
        let square=document.getElementById(`s-${id+1}`)
        square.classList.toggle('highlight-move')
    }
    getPieces(player){
        return this.position.filter(e=>{
            if(e!=undefined){
                return this.getPlayerOfPiece(e)==player
            }
            return false
        })
    }
    removePiece(index){
        this.pieces[index].remove()
    }
    changeZIndex(index){
        let pieces = []
        this.position.map((p, i)=>{if(i==index)pieces.push(String(i))})
        for(let p in this.pieces){
            if(pieces.includes(p)){
                this.pieces[p].style.zIndex = '3'
            }else{   
                this.pieces[p].style.zIndex = '2'
            }
        }
    }
    unhighlight(){
        this.canvas_highlights.map(c=>c.remove())
        if(this.selected)this.toggleHighlight(this.selected)
    }
    highlight(selected){
        let ligal_moves = this.ligal_moves.filter(m=>m[0]==selected).map(m=>m[1])
        this.highlights = ligal_moves
        this.toggleHighlight(selected)
        this.addHighlighter(ligal_moves)
    }
    addHighlighter(moves){
        moves.map(m=>{
            let highlighter = document.createElement('div')
            highlighter.setAttribute('class', this.empty(this.position, m)?'highlighter':'highlighter-takes')
            let file = m%8
            let rank = (m - m%8)/8
            highlighter.style.top = `${100*(7-rank)}px`
            highlighter.style.left = `${100*file}px`
            highlighter.appendChild(document.createElement('div'))
            this.canvas.appendChild(highlighter)
            this.canvas_highlights.push(highlighter)
            
        })
    }
    check(player){
        let other_player_moves = this.getPossibleMoves(this.position, player=='white'?'black':'white')
        let targets = other_player_moves.map(i=>i[1])
        return targets.includes(this.position.indexOf(player=='white'?'K':'k'))
    }
    getLigalMoves(player){
        let possible_moves = this.getPossibleMoves(this.position, player)
        let ligal_moves = []
        let new_position = []
        possible_moves.map(pm=>{
            new_position = Object.assign([], this.position)
                if(typeof(pm)=='object'){
                    new_position[pm[1]] = new_position[pm[0]]
                    new_position[pm[0]] = undefined
                }else{
                
                    new_position[pm=='O-O-O' || pm=='O-O' ?4:60] = undefined
                    new_position[pm=='O-O-O'?2:pm=='O-O'?6:pm=='o-o-o'?58:62] = pm=='O-O-O' || pm=='O-O' ?'K':'k'
                    new_position[pm=='O-O-O'?0:pm=='O-O'?7:pm=='o-o-o'?56:63] = undefined
                    new_position[pm=='O-O-O'?3:pm=='O-O'?5:pm=='o-o-o'?59:61] = pm=='O-O-O' || pm=='O-O' ?'R':'r'
                }
                let _possible_moves = this.getPossibleMoves(new_position, player=='white'?'black':'white')
                if(!_possible_moves.filter(i=>typeof(i)=='object').map(p=>p[1]).includes(new_position.indexOf(player=='white'?'K':'k'))){
                    if(typeof(pm)=='object'){
                        ligal_moves.push(pm)
                    }else{
                        let __possible_moves = this.getPossibleMoves(this.position, player=='white'?'black':'white')
                        let oponent_moves = __possible_moves.filter(i=>typeof(i)=='object').map(p=>p[1])
                        if(!oponent_moves.includes(this.position.indexOf(player=='white'?'K':'k')) && !this.position[(pm=='O-O-O'?3:pm=='O-O'?5:pm=='o-o-o'?59:61)]){
                            ligal_moves.push(pm=='O-O-O'?[4, 2]:pm=='O-O'?[4, 6]:pm=='o-o-o'?[60, 58]:[60,62])
                        }
                    }
                }
                
            })
        return ligal_moves
    }
    getPossibleMoves(position, player){
        // loop through other players pieces and all legal moves and check if any moves go to  where the king
        let ligal_moves = []
        position.map((p, index)=>{
            if(p){
                let piece = this.Pieces[p]
                if(this.getPlayerOfPiece(p)==player){
                    if(piece.name=='pawn'){
                        if(piece.player=='white'){
                            if(this.getQuardinates(index)[0]==2){
                                this.empty(position, index+8)&&ligal_moves.push([index, index+8])
                                if(this.empty(position, index+16) && this.empty(position, index+8)){
                                    ligal_moves.push([index, index+16])
                                }
                            }else{
                                this.empty(position, index+8)&&ligal_moves.push([index, index+8])
                            }
                            if(!this.empty(position, index+9) && !this.is_friend(position, index, index+9) && index%8!=7){
                                ligal_moves.push([index, index+9])
                            }
                            if(!this.empty(position, index+7) && !this.is_friend(position, index, index+7) && index%8!=0){
                                ligal_moves.push([index, index+7])
                            }if(this.getQuardinates(index)[0]==5){
                                if(this.getQuardinates(index)[1]!=0 && !this.empty(position, index-1) && !this.is_friend(position, index-1)){
                                    if(this.moves[this.moves.length-1][0]==index+15 && this.moves[this.moves.length-1][1]==index-1){
                                        ligal_moves.push([index, index+7])
                                    }
                                }
                                if(this.getQuardinates(index)[1]!=7 && !this.empty(position, index+1) && !this.is_friend(position, index+1)){
                                    if(this.moves[this.moves.length-1][0]==index+17 && this.moves[this.moves.length-1][1]==index+1){
                                        ligal_moves.push([index, index+9])
                                    }
                                }
                            }
                        
                        }
                        else{
                            
                            if(this.getQuardinates(index)[0]==7){
                                this.empty(position, index-8)&&ligal_moves.push([index, index-8])
                                if((this.empty(position, index-8)&&this.empty(position, index-16))){
                                    ligal_moves.push([index, index-16])
                                }
                            }else{
                                this.empty(position, index-8)&&ligal_moves.push([index, index-8])
                            }
                            if(!this.empty(position, index-9) && !this.is_friend(position, index, index-9)){
                                ligal_moves.push([index, index-9])
                            }
                            if(!this.empty(position, index-7) && !this.is_friend(position, index, index-7)){
                                ligal_moves.push([index, index-7])
                            }if(this.getQuardinates(index)[0]==4){
                                if(this.getQuardinates(index)[1]!=0 && !this.empty(position, index-1) && !this.is_friend(position, index-1)){
                                    if(this.moves[this.moves.length-1][0]==index-17 && this.moves[this.moves.length-1][1]==index-1){
                                        ligal_moves.push([index, index-9])
                                    }
                                }
                                if(this.getQuardinates(index)[1]!=7 && !this.empty(position, index+1) && !this.is_friend(position, index+1)){
                                    if(this.moves[this.moves.length-1][0]==index-15 && this.moves[this.moves.length-1][1]==index+1){
                                        ligal_moves.push([index, index-7])
                                    }
                                }
                            }
                        }
                        }
                        else{
                    
                            let possible_moves = piece.moves
                            let [rank, file] = this.getQuardinates(index)
                        
                            possible_moves.map(pm=>{
                                let counter = 0
                                while(true){
                                    counter++
                                    let _rank = rank+pm[0]*counter
                                    let _file = file+pm[1]*counter
                                
                                
                                    if(this.is_valid(_rank, _file)){
                                        if(this.empty(position, this.getIndex(_rank, _file))){
                                            ligal_moves.push([index, this.getIndex(_rank, _file)])
                                        }else if(!this.is_friend(position, index, this.getIndex(_rank, _file))){
                                            ligal_moves.push([index, this.getIndex(_rank, _file)])
                                            break
                                        }else{
                                            break
                                        }
                                    }else{
                                        break
                                    }
                                    if(piece.one_move){
                                        break
                                    }
                                }
                            })
                            return ligal_moves
                            
                    }
                }
            }
        })
        // checking if castling is possible
    
        let A_rook_moved = false
        let H_rook_moved = false
        let king_moved = false
        if(player=='white'){
            this.history.map(p=>{
                if(p[0] != 'R'){
                    A_rook_moved = true
                }
                if(p[7] != 'R'){
                    H_rook_moved = true
                }
                if(p[4] != 'K'){
                    king_moved = true
                }

            })
            if(!king_moved && !A_rook_moved && position[1]==undefined && position[2]==undefined && position[3]==undefined){
                ligal_moves.push('O-O-O')
            }
            if(!king_moved && !H_rook_moved  && position[5]==undefined && position[6]==undefined){
                ligal_moves.push('O-O')
            }
        }else{
            this.history.map(p=>{
                if(p[56] != 'r'){
                    A_rook_moved = true
                }
                if(p[63] != 'r'){
                    H_rook_moved = true
                }
                if(p[60] != 'k'){
                    king_moved = true
                }

            })
            if(!king_moved && !A_rook_moved && position[57]==undefined && position[58]==undefined && position[59]==undefined){
                ligal_moves.push('o-o-o')
            }
            if(!king_moved && !H_rook_moved && position[61]==undefined && position[62]==undefined){
                ligal_moves.push('o-o')
            }

        }
        return ligal_moves
        
    }
    promote(src, des){
        this.Promotion = document.createElement('div')
        this.Promotion.setAttribute('class', 'promotion')
        let file = des%8
        let rank = (des - des%8)/8
        this.Promotion.style.top = `${100*(7-rank)}px`
        this.Promotion.style.left = `${100*file}px`
        if(this.getPlayerOfPiece(this.position[src])=='black'){
            this.Promotion.style.transform = 'translateY(-300px)'
        }
        let promote_to = this.getPlayerOfPiece(this.position[src])=='white'?['Q', 'R', 'B', 'N']:['n', 'b', 'r', 'q']
        promote_to.map(pt=>{
            let promote = document.createElement('div')
            promote.setAttribute('class', 'promotion-square')
            promote.onclick = ()=>{
                this.Promotion.remove()
                this.promote_to(pt, src, des)
            }
            let promotion_piece = document.createElement('img')
            promotion_piece.setAttribute('src', this.Pieces[pt].url(this.style))
            promote.appendChild(promotion_piece)
            this.Promotion.appendChild(promote)
        })
    this.canvas.appendChild(this.Promotion)
    }
    promote_to(pt, src, des){
        this.removePiece(src)
        this.move(src, des)
        this.position[des] = pt
        this.addPiece(pt, des)
        this.promoting = false
        this.updatePiecesCaptured(this.player)
        this.updateScore('white')
        this.updateScore('black')
        this.player = this.player=='white'?'black':'white'
        this.changeZIndex()
        this.ligal_moves = this.getLigalMoves(this.player)
        this.checkGame()
        if(this.player=='black')this.moveRandomly()

    }
    checkGame(){
        setTimeout(()=>{
            if(this.ligal_moves.length==0){
                if(this.ligal_moves.length==0){
                    if (this.check(this.player)){
                        this.endGame('checkmate', this.player=='white'?'black':'white')
                    }
                    else{
                        this.endGame('stalemate')
                    }
                }
            }
            // white
            let wpieces = this.getPieces('white')
            let wvalue = this.sum(wpieces.map(e=>this.Pieces[e].value))
            let whaspawn = wpieces.includes('P')
            let bpieces = this.getPieces('black')
            let bvalue = this.sum(bpieces.map(e=>this.Pieces[e].value))
            let bhaspawn = bpieces.includes('p')
            if((wvalue<=3 && !whaspawn)&&(bvalue<=3 && !bhaspawn)){
                this.endGame('draw by insuficient material')
            }
        }, 50)
    }
    sum(pieces){
        let sum=0;
        pieces.map(e=>{
            sum+=e
        })
        return sum
    }
    getPlayerOfPiece(piece){
        return ['R', 'N', 'B', 'Q', 'K', 'P'].includes(piece)?'white':'black'
    }
    is_valid(rank, file){
        return rank>0 & rank<9 & file>0 & file<9
    }
    getIndex(rank, file){
        return (rank-1)*8+(file-1)
    }
    getQuardinates(index){
        let rank = (index - index%8)/8+1
        let file = index%8 +1
        return [rank, file]
    }
    empty(position, index){
        return position[index]==null
    }
    is_friend(position, index, others){
        return this.Pieces[position[index]]?.player==this.Pieces[position[others]]?.player
    }
    moveRandomly(){
        setTimeout(()=>{
            let move = this.ligal_moves[Math.floor(Math.random()*(this.ligal_moves.length-1))]
            let src = move[0]
            let des = move[1]
            console.log(src, des)
            if((this.position[src]=='p' && des<=7) || this.position[src]=='P' && des>=56){
                this.promoting = true
                let promote_to = this.getPlayerOfPiece(this.position[src])=='white'?['Q', 'R', 'B', 'N']:['n', 'b', 'r', 'q']
                this.promote_to(promote_to[Math.floor(Math.random()*4)], src, des)
            }else{
                this.move(src, des)
                this.updatePiecesCaptured(this.player)
                this.updateScore('white')
                this.updateScore('black')
                this.player = this.player=='white'?'black':'white'
                this.ligal_moves = this.getLigalMoves(this.player)
                this.checkGame()
            }
            this.unhighlight()
            this.selected = undefined
            this.highlights = []
        }, 2000)
    }
    decodeFen(fen){
        let array_of_squares = []
        fen.split('/').map(rank=>{
            for(let i of rank){
                if(/\d/.test(i)){
                    for(let e=0;e<Number(i);e++){
                        array_of_squares.push(undefined)
                    }
                }else{
                    array_of_squares.push(i)
                }
            }
        })
        return array_of_squares
    }
    encodeFen(position){
        let fen = ''
        let empty=0
        for(let i=0;i<64;i++){
            if(i>0 && i%8==0){
                if(empty!=0){
                    fen+=empty
                    empty=0
                }
                fen+='/'
            }
            if(position[i]==undefined){
                empty+=1
            }else{
                if(empty!=0){
                    fen+=empty
                    empty=0
                }
                fen+=position[i]
            }
            
        }
        return fen
    }
    
    buildBoard(parent){
        let boardDiv = document.createElement('div')
        boardDiv.setAttribute('id', 'board')
        this.buildStatusBar(parent, 'black')
        parent.appendChild(boardDiv)
        this.buildStatusBar(parent, 'white')
        for(let r=8;r>0;r--){
            let rank=document.createElement('div')
            rank.setAttribute('id', `rank-${r}`)
            rank.setAttribute('class', `rank`)
            for(let f=0;f<8;f++){
                let square=document.createElement('div')
                square.setAttribute('id', `s-${r*8+f-7}`)
                square.setAttribute('class', `square`)
                square.style.backgroundColor = (r*8+f+1)%2==0&&(r*8+f)%16<=8 || (r*8+f+1)%2==1&&(r*8+f)%16>=8 ?this.color[1]:this.color[0]
                if(r==1){
                    let fileId = document.createElement('h3')
                    fileId.setAttribute('class', 'file-id')
                    fileId.style.color = (r*8+f+1)%2==0&&(r*8+f)%16<=8 || (r*8+f+1)%2==1&&(r*8+f)%16>=8?this.color[0]:this.color[1]
                    fileId.textContent = ['A','B','C','D','E','F','G','H'][f]
                    square.appendChild(fileId)
                }
                if(f==0){
                    let rankId = document.createElement('h3')
                    rankId.setAttribute('class', 'rank-id')
                    rankId.style.color = (r*8+f+1)%2==0&&(r*8+f)%16<=8 || (r*8+f+1)%2==1&&(r*8+f)%16>=8?this.color[0]:this.color[1]
                    rankId.textContent = r
                    square.appendChild(rankId)
                }

                rank.appendChild(square)
            }
            boardDiv.appendChild(rank)
        }
        this.canvas = document.createElement('div')
        this.canvas.setAttribute('id', 'canvas')
        boardDiv.appendChild(this.canvas)
    }
    changeTime(){
        let timeEle = document.getElementById(`time-${'white'}`)
        timeEle.innerHTML=this.getTime(this.game.time['white'])
        if(this.player=='white'){
            timeEle.parentElement.style.opacity=1
        }else{
            timeEle.parentElement.style.opacity=.3
        }
        timeEle = document.getElementById(`time-${'black'}`)
        timeEle.innerHTML=this.getTime(this.game.time['black'])
        if(this.player=='black'){
            timeEle.parentElement.style.opacity=1
        }else{
            timeEle.parentElement.style.opacity=0.5
        }
        let clockEle = document.getElementById(`clock-${'white'}`)
        clockEle.style.transform = `rotate(${90*(this.time-Math.floor(this.game.time['white']/1000))}deg)`
        if(this.player=='white'){
            clockEle.style.opacity=1
        }else{
            clockEle.style.opacity=0
        }
        clockEle = document.getElementById(`clock-${'black'}`)
        if(this.player=='black'){
            clockEle.style.opacity=1
        }else{
            clockEle.style.opacity=0
        }
        clockEle.style.transform = `rotate(${90*(this.time-Math.floor(this.game.time['black']/1000))}deg)`
    }
    getTime(time){
        time=Math.floor(time/1000)
        return `${Math.floor(time/60)>=10?'':'0'}${Math.floor(time/60)}:${time%60>=10?'':'0'}${time%60}`
    }
    updatePiecesCaptured(player){
        let captured_pieces = document.getElementById(`pieces-${player}`)
        captured_pieces.innerHTML=''
        let type_captured_pieces = [...this.game.captured[player]].map(p=>p.toLowerCase())
        let pieces = ['p', 'b', 'n', 'r', 'q']
        let pieceCount = [0, 0, 0, 0, 0]
        type_captured_pieces.map(p=>pieceCount[pieces.indexOf(p)]++)
        let PieceImg
        let counter = 0
        for(let i=0;i<5;i++){
            for(let e=0;e<pieceCount[i];e++){
                PieceImg = document.createElement('img')
                PieceImg.setAttribute('src', this.Pieces[player=='black'?pieces[i].toUpperCase():pieces[i]].url(this.style))
                PieceImg.setAttribute('class', 'captured-piece')
                PieceImg.style.left = `${(counter)*10}px`
                captured_pieces.appendChild(PieceImg)
                counter++
            }
            if(pieceCount[i]>0)counter+=1
        }
    }
    updateScore(player){
        let scoreEle = document.getElementById(`score-${player}`)
        scoreEle?.remove()
        let captured_pieces = document.getElementById(`pieces-${player}`)
        scoreEle = document.createElement('h3')
        scoreEle.setAttribute('id', `score-${player}`)
        scoreEle.setAttribute('class', 'score')
        captured_pieces.appendChild(scoreEle)
        let pieces = this.getPieces(player)
        let value = this.sum(pieces.map(e=>this.Pieces[e].value))
        let opieces = this.getPieces(player=='white'?'black':'white')
        let ovalue = this.sum(opieces.map(e=>this.Pieces[e].value))
        let type_captured_pieces = [...this.game.captured[player]].map(p=>p.toLowerCase())
        pieces = ['p', 'b', 'n', 'r', 'q']
        let pieceCount = [0, 0, 0, 0, 0]
        type_captured_pieces.map(p=>pieceCount[pieces.indexOf(p)]++)
        let counter = 0
        pieceCount.map(c=>{c!=0&&counter++;counter+=c})
        scoreEle.style.left =  `${(counter)*10+5}px`
        if(value-ovalue>0){
            scoreEle.innerHTML = `+${value-ovalue}`
        }
    }
    buildStatusBar(parent, player){
        console.log('clclcl')
        let status = document.createElement('div')
        status.innerHTML=`
        <div class="status">
            <div class="status__left">
                <div class="status__profile">
                    <img src="${this.Pieces[player=='white'?'K':'k'].url(this.style)}">
                </div>
                <div class="status__details">
                    <h3 class="status__details__name">${this.game[player]}</h3>
                    <h3 id="pieces-${player}" class="status__details__pieces">
                    </h3>
                </div>
            </div>
            <div class="status__timer status__timer-${player}">
                <img id="clock-${player}" src="static/clock-${player}.svg" class="status__timer-timer">
                <h3 id="time-${player}" class="status__timer__time">${this.getTime(this.game.time[player])}</h3>
            </div>
        </div>`
        parent.appendChild(status)
    }
}
let game = new Chess('You', 'Opponent', 1*60, 0, 0)
game.init()
game.start()