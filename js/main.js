( function () {
    window.addEventListener( 'tizenhwkey', function( ev ) {
        if( ev.keyName === "back" ) {
            tizen.application.getCurrentApplication().exit();
        }
    } );
} () );

var JSmetronome = {
	GUI:{
		power : document.getElementById("power_l"),
		tap : document.getElementById("tap"),
		//tapBkg : document.getElementById("tapBkg"),
		tempoUp : document.getElementById("tempoUp"),
		tempoDown : document.getElementById("tempoDown"),
		tempoDisplay : document.getElementById("tempoDisplay"),

		Tick_drum : document.getElementById("Tick_drum"),
		Tick_elec : document.getElementById("Tick_elec"),
		Tok_drum : document.getElementById("Tok_drum"),
		Tok_elec : document.getElementById("Tok_elec"),

		timeSignature : document.getElementById("timeSignature"),
		beatDisplay : document.getElementById("Beat"),
		editTempo : document.getElementById("tempoDisplay"),
		soundMute : document.getElementById("BellMute_l"),
		
		Bell_drum : document.getElementById("Bell_drum"),
		Bell_elec : document.getElementById("Bell_elec")
				
	},
	vars:{
		power : false,
		tempo : 0,
		bufferSound : 0,
		BeatsPerMeasure:0,
		BeatSubdivision:0,
		CurrentBeatSubdivision:0,
		currentBeat : 0,
		lastTap : 0,
		_timeoutID : 0,
		_tempoMin : 1,
		_tempoMax : 250,
		_timeSignature:[
			// name , beats, time subdivision(2 = binary / 3 = ternary)
			[2,4,2],
			[3,4,2],
			[4,4,2],
			[6,8,3],
			[9,8,3],
			[12,8,3]
		]
	},
	
	setTimeSignature: function(timeSignature){
		
		//check if it's a number
		if(!isNaN(parseFloat(timeSignature)) && isFinite(timeSignature)){
			// if its positive, rotate one step positive or negative the array items. Selected item, result as first of list.
			if(timeSignature >= 0){
				// positive array rotation
				var currentTimeSignature = this.vars._timeSignature.shift();
				this.vars._timeSignature.push(currentTimeSignature);
				currentTimeSignature = this.vars._timeSignature[0];
			}else{
				// negative array rotation
				var currentTimeSignature = this.vars._timeSignature.pop();
				this.vars._timeSignature.unshift(currentTimeSignature);
				currentTimeSignature = this.vars._timeSignature[0];
			}
		}else{
			// If timesignature provided as String (ex. "4/4"), find coincidences with array items
			var currentTimeSignature= timeSignature.split("/");
			for(var i=0; i < this.vars._timeSignature.length; i++) {
				if(this.vars._timeSignature[i][0]== currentTimeSignature[0] && this.vars._timeSignature[i][1]== currentTimeSignature[1]){
					currentTimeSignature[2] = this.vars._timeSignature[i][2];
					for(var r=0; r < i; r++) this.setTimeSignature(+1);
				};
			}
			if(!currentTimeSignature[2]) return false;
		}
		//config system with new Time Signature params.
		this.vars.BeatSubdivision = currentTimeSignature[2];
		this.vars.BeatsPerMeasure = (this.vars.BeatSubdivision == 3) ? (currentTimeSignature[0]/3) : currentTimeSignature[0];
		//reinitiate counters
		this.vars.currentBeat = 0;
		this.vars.CurrentBeatSubdivision = 0;
		//draw interface
		this.GUI.timeSignature.innerHTML = currentTimeSignature[0] + "/" + currentTimeSignature[1];
		
		//document.body.style.background='url('+background')';
		//reset and restart.
		clearTimeout(this.vars._timeoutID);
		this.tick();
		return true;
	},
	setTempo: function(newTempo,operator){
		if(operator) var newTempo = (operator == "+") ? this.vars.tempo + newTempo : this.vars.tempo - newTempo;
		if(newTempo >= this.vars._tempoMax) newTempo = this.vars._tempoMax;
		if(newTempo <= this.vars._tempoMin) newTempo = this.vars._tempoMin;
		this.vars.tempo = newTempo;
		this.GUI.tempoDisplay.innerHTML = this.vars.tempo;
		// 비트 변경시에 0으로 초기화 되는것 막아줌
		// this.vars.currentBeat = 0;
		this.vars.CurrentBeatSubdivision = 0;
		clearTimeout(this.vars._timeoutID);
		this.tick();
		return true;
	},
	tick: function(){
		if(!this.vars.power) return false;
		if(this.vars.currentBeat >= this.vars.BeatsPerMeasure) {this.vars.currentBeat = 1;}
			else {this.vars.currentBeat += 1;}
		this.GUI.metronomeBell.pause();
		this.GUI.metronomeTick.pause();
		this.GUI.metronomeBell.currentTime = 0;
		this.GUI.metronomeBell.pause();
		this.GUI.metronomeTick.currentTime = 0;
		this.GUI.metronomeTick.pause();
		if(this.vars.currentBeat == 1)	
		{
			this.GUI.metronomeBell.play();
			//this.vars.currentBeat.style.textcolor = "red";
		}
		else 
		{
			this.GUI.metronomeTick.play();
		}
		this.GUI.beatDisplay.innerHTML = this.vars.currentBeat;
		this.vars._timeoutID = setTimeout(function(){this.tick()}.bind(this), 1000/(this.vars.tempo/53.2));
		return true;
	},
	tap: function(){
		// this.GUI.tapBkg.style.visibility  = "visible";
		var lastTapTime = this.vars.lastTap;
		var currentTapTime = new Date().getTime();
		this.vars.lastTap =  currentTapTime;
		var newTempo = Math.round(1000/(currentTapTime-lastTapTime)*60);
		this.setTempo(newTempo);
		return true;
	},
	power: function(status){
		if(this.vars.power){
			this.vars.power = false;
			clearTimeout(this.vars._timeoutID);
			this.vars.currentBeat = 0;
			this.GUI.beatDisplay.innerHTML = this.vars.currentBeat;
		}else{
			this.vars.power = true;
			this.tick();
		};
	},
	editTempo: function(){
		// enable to edit tempo by clicking the number. 0408
		// enable to limit editing tempo. 1~250 number. 0409
		var input_num = prompt('BPM ?', this.vars.tempo);
		if(input_num != null && input_num <=250 && input_num > 0)
		{
			this.vars.tempo = input_num;
			this.GUI.tempoDisplay.innerHTML = this.vars.tempo;
			this.vars.CurrentBeatSubdivision = 0;
			clearTimeout(this.vars._timeoutID);
			this.tick();
			return true;
		}
		else
			this.editTempo();	
	},
	changeSound: function(index){
		var name = 0;
		if(index == 0){
			this.GUI.metronomeTick = this.GUI.Tick_drum;
			this.GUI.metronomeBell = this.GUI.Tok_drum;
			name = "DRUM";}
		if(index == 1){
			this.GUI.metronomeTick = this.GUI.Tick_elec;
			this.GUI.metronomeBell = this.GUI.Tok_elec;
			name = "ELECTRIC";}
		//alert('Change '+ name + ' Sound !');
	},
	changeSoundMute: function(){
		this.GUI.Tick_drum.muted = !this.GUI.Tick_drum.muted;
		this.GUI.Tok_drum.muted = !this.GUI.Tok_drum.muted; 
		this.GUI.Tick_elec.muted = !this.GUI.Tick_elec.muted;
		this.GUI.Tok_elec.muted = !this.GUI.Tok_elec.muted; 
	},

	init: function(){
		this.GUI.timeSignature.onmousedown = function(){this.setTimeSignature(+1)}.bind(this);
		this.GUI.power.onmousedown = function(){this.power()}.bind(this);
		this.GUI.tap.onmousedown = function(){this.tap()}.bind(this);
		this.GUI.tap.onmouseup = function(){this.GUI.tapBkg.style.visibility  = "hidden "}.bind(this);
		this.GUI.tap.onmouseout = function(){this.GUI.tapBkg.style.visibility  = "hidden"}.bind(this);
		this.GUI.tempoUp.onmousedown = function(){ProgInterval.add(function(){this.setTempo(1,'+')}.bind(this),1000,0.18,'tempoUp')}.bind(this);
		this.GUI.tempoUp.onmouseup = function(){ProgInterval.del('tempoUp')}.bind(this);
		this.GUI.tempoUp.onmouseout = function(){ProgInterval.del('tempoUp')}.bind(this);
		this.GUI.tempoDown.onmousedown = function(){ProgInterval.add(function(){this.setTempo(1,'-')}.bind(this),1000,0.18,'tempoDown')}.bind(this);
		this.GUI.tempoDown.onmouseup = function(){ProgInterval.del('tempoDown')}.bind(this);
		this.GUI.tempoDown.onmouseout = function(){ProgInterval.del('tempoDown')}.bind(this);
		this.GUI.tempoDisplay.onclick = function(){this.editTempo()}.bind(this);
		this.GUI.soundMute.onclick = function(){this.changeSoundMute()}.bind(this);
		
		this.GUI.Bell_drum.onclick = function(){this.changeSound(0)}.bind(this);
		this.GUI.Bell_elec.onclick = function(){this.changeSound(1)}.bind(this);
				
		this.setTimeSignature("4/4");
		this.setTempo(180);
		this.GUI.metronomeTick = this.GUI.Tick_drum;
		this.GUI.metronomeBell = this.GUI.Tok_drum;
				
		return true;
	}
}


var ProgInterval = {
	_active: [],
	_exec: function(callback,interval,acceleration,ID){
		if(this._active.indexOf(ID) == -1) return false;
		callback();
		interval += interval*(acceleration*(-1));
		if(interval <= 1) interval = 1;
		//console.log(interval);
		setTimeout(function(){this._exec(callback,interval,acceleration,ID)}.bind(this),interval);
	},
	add: function(callback,interval,acceleration,ID){
		var acceleration = acceleration || 0;
		this._active.push(ID);
		this._exec(callback,interval,acceleration,ID);
	},
	del: function(ID){
		var position = this._active.indexOf(ID);
		if(position != -1) this._active.splice(position,1);
	}
}
