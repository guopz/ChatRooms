var socketio = require('socket.io');
var io;
var guestNumber = 1;
var nickNames = {};
var namesUsed = [];
var currentRoom = {};

// 启动Socket.IO服务器
exports.listen = function(server){
	io = socketio.listen(server);
	io.set('log level',1);
	io.sockets.on('connection',function(socket){
		guestNumber = assignGuestName(socket,guestNumber,nickNames,namesUsed);

		joinRoom(socket,'Lobby');
		
		handleMessageBroadcasting(socket,nickNames);
		handeNameChangeAttempts(socket,nickNames,namesUsed);
		handleRoomJoining(socket);

		socket.on('rooms',function(){
			socket.emit('rooms',io.sockets.manager.rooms);
		});

		handleCilentDisconnection(socket,nickNames,namesUsed);
	});

};

// 分配用户昵称
function assignGuestName(socket,guestNumber,nickNames,namesUsed){
	var name = 'Guest' + guestNumber;
	nickNames[socket.id] = name;
	socket.emit('nameResult',{
		success:true,
		name:name
	});
	namesUsed.push(name);
	return guestNumber + 1;
}

// 与进入聊天室相关的逻辑
function joinRoom(socket,room){
	socket.join(room);
	currentRoom[socket.id] = room;
	socket.emit('joinResult',{room:room});
	
	socket.broadcast.to(room).emit('message',{
		text:nickNames[socket.id] + ' 进入房间 ' + room + '.'
	});

	var usersInRoom = io.sockets.clients(room);
	
	if(usersInRoom.length > 1){
		
		var usersInRoomSummary = '用户目前在 ' + room +' : ';
		for(var index in usersInRoom){

			var userSocketId = usersInRoom[index].id;
			if(userSocketId != socket.id){
				
				if(index > 0){
					usersInRoomSummary += ', ';
				}
				usersInRoomSummary += nickNames[userSocketId];
			}
		}
		// for end
		// console.log(usersInRoomSummary);
		usersInRoomSummary += '.';
		socket.emit('message',{text:usersInRoomSummary})
	}
	// if end
}

// 更名请求的处理逻辑
function handeNameChangeAttempts(socket,nickNames,namesUsed){
	socket.on('nameAttempt',function(name){
		if(name.indexOf('Guest') == 0 ){
			
			socket.emit('nameResult',{
				success:false,
				message:'Names cannot begin with "Guest".'
			});

		}else{

			if(namesUsed.indexOf(name) == -1 ){
				var previousName = nickNames[socket.id];
				var previousNameIndex = namesUsed.indexOf(previousName);

				namesUsed.push(name);
				nickNames[socket.id] = name;
				socket.emit('nameResult',{
					success:true,
					name:name
				});
				socket.broadcast.to(currentRoom[socket.id]).emit('message',{
					text:previousName + ' 更改昵称为 ' + name + '.'
				})
			}else{
				socket.emit('nameResult',{
					success:false,
					message:'That name is already is use.'
				});
			}

		}
	})
}

// 发送聊天消息
function handleMessageBroadcasting(socket,nickNames){
	socket.on('message',function(message){
		socket.broadcast.to(message.room).emit('message',{
			text: nickNames[socket.id] + ' : ' + message.text
		});
	});
}

// 创建房间
function handleRoomJoining(socket){
	socket.on('join',function(room){
		socket.leave(currentRoom[socket.id]);
		joinRoom(socket,room.newRoom)
	})
}

// 用户断开连接
function handleCilentDisconnection(socket,nickNames,namesUsed){
	socket.on('disconnect',function(){
		var nameIndex = namesUsed.indexOf(nickNames[socket.id]);
		delete namesUsed[nameIndex];
		delete nickNames[socket.id];
	})
}