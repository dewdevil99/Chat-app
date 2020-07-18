// Connect to websocket
var socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port);

document.addEventListener('DOMContentLoaded',() => {

	

	socket.on('connect', () => {
		document.querySelector('#channel_form').onsubmit = () =>{
			const channel_name=document.querySelector('#channel_name').value;
			socket.emit('new channel created',{'channel_name': channel_name});
			document.querySelector('#channel_name').value='';
			return false;
		};
	});

	socket.on('display new channel', cn => {
		const span=document.querySelector('#channel_exist');
		span.innerHTML='';

		const li=document.createElement('li');
		var att1=document.createAttribute('class');
		att1.value="nav-item";
		li.setAttributeNode(att1);
		var att2=document.createAttribute('id');
		att2.value=cn.channel_name;
		li.setAttributeNode(att2);
		document.querySelector('#channel_list').append(li);

		const a=document.createElement('a');
		a.innerHTML=att2.value;
		var href=document.createAttribute('href');
		href.value=`javascript:load_channel(${cn.channel_name})`;
		a.setAttributeNode(href);
		var aclass=document.createAttribute('class');
		aclass.value='nav-link';
		a.setAttributeNode(aclass);
		var page_att=document.createAttribute('data-page');
		page_att.value=cn.channel_name;
		a.setAttributeNode(page_att);
		document.querySelector(`#${att2.value}`).append(a);
	});

	socket.on('channel exists', () => {
		const span=document.querySelector('#channel_exist');
		span.innerHTML='This channel name exists';
	});

	document.querySelector("#logout_button").onclick = () => {
		var disp_name=document.querySelector("#name").innerHTML;
		socket.emit('user exit',{'disp_name': disp_name});
	};

	socket.on('redirect', url_redirect => {
		window.location=url_redirect.url;
	});

	load_channel('default');

	socket.on('new user joined', data => {
		const div=document.createElement('div');
		div.innerHTML=`${data.user} has joined the room`;
		document.querySelector('#chat_window').prepend(div);
	});

	socket.on('left room', data => {
		const div=document.createElement('div');
		div.innerHTML=`${data.user} has left the room`;
		document.querySelector('#chat_window').prepend(div);
	});

	document.querySelector('#send_msg').onclick = () => {
		var msg=document.querySelector('#message_box').value;
		var channel_name=document.querySelector('#channel_title').innerHTML;
		channel_name=channel_name.trim();
		var user=document.querySelector('#name').innerHTML;
		console.log(msg);
		console.log(channel_name);
		if(msg!=''){
			console.log(msg);
			socket.emit('new message',{'message': msg, 'channel': channel_name, 'user': user});
		}
		document.querySelector('#message_box').value='';
	};

	socket.on('display message', data => {
		const div=document.createElement('div');
		div.style.paddingLeft="5px"
		div.style.border="solid";
		div.style.borderColor='grey';
		div.style.borderRadius="15px";
		div.style.marginBottom="7px";
		div.style.marginTop="3px"
		div.id=data.user.concat(data.time.split('.')[0]);
		document.querySelector('#chat_window').prepend(div);
		const h4=document.createElement('h4');
		h4.innerHTML=data.user;
		document.getElementById(div.id).append(h4);
		const p=document.createElement('p');
		p.innerHTML=data.message.replace(/\n/g,"<br>");
		p.style.marginBottom="2px";
		document.getElementById(div.id).append(p);
		const time_span=document.createElement('span');
		t=new Date(Number(data.time));
		time_span.innerHTML=t.toLocaleString();
		document.getElementById(div.id).append(time_span);
		// var chat_window=document.querySelector('#chat_window');
		// chat_window.scrollTop=chat_window.scrollHeight;
	})

	document.querySelector('#chat_window').style.minHeight=(window.innerHeight-document.querySelector('.jumbotron').style.height-310)+"px";
	document.querySelector('#chat_window').style.maxHeight=(window.innerHeight-document.querySelector('.jumbotron').style.height-310)+"px";
	document.querySelector('#channel_list').style.minHeight=(window.innerHeight-document.querySelector('.jumbotron').style.height-310)+"px";
	document.querySelector('#channel_list').style.maxHeight=(window.innerHeight-document.querySelector('.jumbotron').style.height-310)+"px";
	// document.querySelector('#chat_window').style.height=window.innerHeight-document.querySelector('.jumbotron').style.height-document.querySelector('#channel_title').style.height-document.querySelector('#message_box').style.height;

	// document.querySelectorAll(".nav-link").forEach(link =>{
	// 	link.onclick = () =>{
	// 		document.querySelector('#channel_title').innerHTML=link.dataset.page;
	// 		load_channel(link.dataset.page);
	// 		console.log("second");
	// 		return false;
	// 	};
	// });
		
});

// window.addEventListener("resize", () => {
// 	var windowHeight = window.innerHeight;
//     document.body.style.height = windowHeight + "px";
//     console.log(document.body.style.height);
// },false);

var previous_channel='default';

function load_channel(channel_name) {
	if (channel_name=='default') {
		document.querySelector('#channel_title').innerHTML='';
		document.querySelector('#chat_window').innerHTML='Please select a channel';
	}
	else{
		document.querySelector('#chat_window').innerHTML='';
		document.querySelector('#channel_title').innerHTML=channel_name.textContent;
		document.querySelector('#message_box').removeAttribute("disabled");
		const request = new XMLHttpRequest();
		console.log("first");
		request.open('GET', `/${channel_name.textContent}`);
		request.responseType='json';
		request.onload = () => {
			const response=request.response;
			console.log("third");
			for (var key in response) {
				const div=document.createElement('div');
				div.style.paddingLeft="5px";
				div.style.border="solid";
				div.style.borderColor='grey';
				div.style.borderRadius="15px";
				div.style.marginBottom="7px";
				div.style.marginTop="3px";
				div.id=key.split('|')[1].concat(key.split('.')[0]);
				document.querySelector('#chat_window').prepend(div);
				const h4=document.createElement('h4');
				h4.innerHTML=key.split("|")[1];
				document.getElementById(div.id).append(h4);
				const p=document.createElement('p');
				p.innerHTML=response[key].replace(/\n/g,"<br>");
				p.style.marginBottom="2px";
				document.getElementById(div.id).append(p);
				const time_span=document.createElement('span');
				t=new Date(Number(key.split("|")[0]));
				time_span.innerHTML=t.toLocaleString();
				document.getElementById(div.id).append(time_span);
			}
		};
		request.send();
		let name=document.querySelector('#name').innerHTML;
		if(previous_channel!=channel_name.textContent && previous_channel!="default"){
			socket.emit('leave', {'name': name, 'channel': previous_channel});
		}
		previous_channel=channel_name.textContent;
		socket.emit('join', {'name': name, 'channel': channel_name.textContent});
	}
}