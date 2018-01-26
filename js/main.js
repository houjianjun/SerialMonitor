//定义连接选项
var connectionOptions = {
	"bitrate": 9600,
	"dataBits": "eight",
	"parityBit": "no",
	"stopBits": "one",
	"receiveTimeout": 500,
	"sendTimeout": 500
};

var connectionId = -1;
var selectedPort = "";
var selectedSpeed = 9600;
var connected = false;
var message = "";

var init = function() {

	//得到串口，将其添加到下拉列表
	chrome.serial.getDevices(function(ports) {
		//得到端口名称
		ports.sort(function(a, b) {
			a = a.path.replace("COM", "");
			b = b.path.replace("COM", "");
			return a - b;
		});
		var newOption = "";
		for(var i = 0; i < ports.length; i++) {
			var portName = ports[i].path;
			newOption += '<option value="' + portName + '">' + portName + '</option>';
		}
		document.querySelector("#serial_ports_combobox").innerHTML = newOption;

		//添加选中默认波特率
		var options = document.querySelector("#baud_rates_combobox").options;

		for(var index = 0; index < options.length; index++) {
			if(options[index].value == selectedSpeed) {
				options[index].selected = true;
			}
		}
	});
	//更新界面
	updateGUI();
};

//初始化
init();

//全部清空
document.querySelector("#clear_button").onclick=function(){
	message="";
	document.querySelector("#receive_textarea").innerText ="";
};
//连接事件
document.querySelector("#connect_button").onclick = function() {
	if(!connected) {
		//选择串口号与波特率
		selectedPort = document.querySelector("#serial_ports_combobox").value;
		selectedSpeed = document.querySelector("#baud_rates_combobox").value;
		connectionOptions.bitrate = parseInt(selectedSpeed);

		chrome.serial.connect(selectedPort, connectionOptions, onConnect);
	} else {
		//断开连接
		chrome.serial.disconnect(connectionId, onDisconnect);
	}
};

//发送事件
document.querySelector("#send_button").onclick = function() {
	if(connected) {
		var textToSend = document.querySelector("#send_text").value;

		//添加选择结束行
		if(document.querySelector("#endofline_combobox").value == "NL") textToSend += '\n';
		else if(document.querySelector("#endofline_combobox").vvalue == "CR") textToSend += '\r';
		else if(document.querySelector("#endofline_combobox").value == "NLCR") textToSend += '\r\n';

		//数据发送
		chrome.serial.send(connectionId, convertStringToArrayBuffer(textToSend), function(sendInfo) {
			//消息提示
			if(sendInfo.error)
				message += '无法发送数据: ' + sendInfo.error + '\n';
			document.querySelector("#receive_textarea").innerText = message;
		});
	}
};

//界面更新
function updateGUI() {
	//默认为false
	if(connected) {
		document.querySelector("#send_text").removeAttribute('disabled');
		document.querySelector("#endofline_combobox").removeAttribute('disabled');
		document.querySelector("#send_button").removeAttribute('disabled');
		document.querySelector("#serial_ports_combobox").setAttribute('disabled', true);
		document.querySelector("#baud_rates_combobox").setAttribute('disabled', true);
		document.querySelector("#connect_button").setAttribute('value', '断开');
	} else {
		document.querySelector("#send_text").setAttribute('disabled', true);
		document.querySelector("#endofline_combobox").setAttribute('disabled', true);
		document.querySelector("#send_button").setAttribute('disabled', true);
		document.querySelector("#serial_ports_combobox").removeAttribute('disabled');
		document.querySelector("#baud_rates_combobox").removeAttribute('disabled');
		document.querySelector("#connect_button").setAttribute('value', '连接');
	}
}

//回调函数的连接方法
function onConnect(connectionInfo) {

	//检查连接是否成功
	if(connectionInfo) {
		connectionId = connectionInfo.connectionId;
		connected = true;
		updateGUI();
		//添加接收数据事件监听
		chrome.serial.onReceive.addListener(onReceive);
		//如果没有,显示错误消息
	} else {
		if(chrome.runtime.lastError && chrome.runtime.lastError.message)
			errorMsg = chrome.runtime.lastError.message;
		else
			errorMsg = "未能连接到端口.";
		//消息提示
		message += errorMsg + '\n';
		document.querySelector("#receive_textarea").innerText = message;
	}
}

//断开连接
function onDisconnect(result) {

	if(result) {
		connected = false;
		updateGUI();
	} else {
		//消息提示
		message += '无法断开\n';
		document.querySelector("#receive_textarea").innerText = message;
	}
}

//当接收到新的数据回调函数
function onReceive(info) {
	// 检查数据是否来自串行
	if(info.connectionId == connectionId && info.data) {
		// ArrayBuffer转换为字符串,并添加到文本区域
		var str = convertArrayBufferToString(info.data);
		message += str;
		document.querySelector("#receive_textarea").innerText = str;
	}
}

//缓冲数组转换为字符串
function convertArrayBufferToString(buf) {

	var bufView = new Uint8Array(buf);
	var encodedString = String.fromCharCode.apply(null, bufView);
	return decodeURIComponent(encodedString);
}

//将一个字符串转换为数组缓冲区
var convertStringToArrayBuffer = function(str) {
	var buf = new ArrayBuffer(str.length);
	var bufView = new Uint8Array(buf);
	for(var i = 0; i < str.length; i++) bufView[i] = str.charCodeAt(i);
	return buf;
};