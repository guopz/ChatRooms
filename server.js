var http = require('http');
var fs = require('fs');
var path = require('path');
var mime = require('mime');
var chatServer = require('./lib/chat_server');

var cache = {};

// 发送文件数据及错误响应
function send404(res){
	res.writeHead(404,{'Content-Type':'text/plain'});
	res.write('Error 404 : resource not fond.');
	res.end();
}

// 提供文件数据服务
function sendFile(res,filePath,fileContents){
	res.writeHead(
		200,
		{"content-type":mime.lookup(path.basename(filePath))});
	res.end(fileContents);
}

// 提供静态文件服务
function serverStatic(res,cache,absPath){
	
	if(cache[absPath]){
		sendFile(res,absPath,cache[absPath]);
	}else{
		fs.exists(absPath,function(exists){
			if(exists){
				fs.readFile(absPath,function(err,data){
					if(err){send404(res)}
					else{
						cache[absPath] = data;
						sendFile(res,absPath,data);
					}
				})
			} else {
				send404(res);
			}
		});
	}
}

var server = http.createServer(function(req,res){
	var filePath = false;
	
	// return false;
	if(req.url == '/'){
		filePath = 'public/index.html'
	}else{
		filePath = 'public' + req.url;
	}
	// console.log('server1 -' + filePath);
	var absPath = './' + filePath;
	serverStatic(res,cache,absPath);
});

chatServer.listen(server);

server.listen(3000,function(){
	console.log("Server listening on port 3000");
});