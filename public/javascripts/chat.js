var Chat = function(socket){
	this.socket = socket;
}

// 接着添加这个发送聊天消息的函数
Chat.prototype.sendMessage = function(room,text){
	var message = {
		room:room,
		text:text
	}
	this.socket.emit('message',message);
}

// 变更房间的函数
Chat.prototype.changeRoom = function(room){
	this.socket.emit('join',{
		newRoom:room
	})
}

// 处理聊天命令
Chat.prototype.processCommand = function(command){
	
	var words = command.split(' ');
	var command = words[0].substring(1,words[0].length).toLowerCase();
	var message = false;
	console.log(command);
	switch(command){
		case 'join':
		words.shift();
		var room = words.join(' ');
		this.changeRoom(room);
		break;
		
		case 'nick':
		var name = words[1];
		this.socket.emit('nameAttempt',name);
		break;

		default:
		message = 'Unrecognized command.';
		break;	
	}

	return message;
}