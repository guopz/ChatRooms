
function divEscapedContentElement(message){
	return $('<div></div>').text(message);
}

function divSystemContentElement(message){
	return $('<div></div>').html('<i>' + message + '</i>');
}

// 处理原始的用户输入
function processUserInput(chatApp,socket){
	var message = $('#send-message').val();
	var systemMessage;

	if(message.charAt(0) == '/') {
		
		systemMessage = chatApp.processCommand(message);
		
		if(systemMessage){
			$('#messages').append(divSystemContentElement(message));
		}

	}else{
		console.log($('#room').text());
		chatApp.sendMessage($('#room').text(),message);
		$('#messages').append(divEscapedContentElement(message));
		$('#messages').scrollTop($('#messages').prop('scrollHeight'));
	}

	$('#send-message').val('');
}

var socket = io.connect();

$(function(){
	var chatApp = new Chat(socket);

	// success 显示更名尝试的结果
	socket.on('nameResult',function(result){
		var message;
		
		if(result.success){
			message = '您现在的昵称是：' + result.name + '.';
		}else{
			message =  result.message;
		}
		
		$('#messages').append(divSystemContentElement(message));
	});

	// success 显示房间变更结果
	socket.on('joinResult',function(result){
		$('#room').text(result.room);
		$("#messages").append(divSystemContentElement(' 进入房间'));
	});

	// success 显示接收到的消息
	socket.on('message',function(message){
		
		var newElement = $('<div></div>').text(message.text);
		$('#messages').append(newElement);
	});

	// success 显示可用房间列表
	socket.on('rooms',function(rooms){
		$('#room-list').empty();
		
		for(var room in rooms){
			room = room.substring(1,room.length);
			
			if(room != ''){
				$('#room-list').append(divEscapedContentElement(room));
			}
		}

		// 点击房间名可以换到那个房间中
		$('#room-list div').click(function(){
			chatApp.processCommand('/join '+ $(this).text());
			$('#send-message').focus();
		});

	});

	// 定期请求可用房间列表
	setInterval(function(){
		socket.emit('rooms');
	},1000);

	$('#send-message').focus();

	// 提交表单可以发送聊天消息
	$("#send-form").submit(function(){
		processUserInput(chatApp,socket);
		return false;
	})
})