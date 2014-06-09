var fs = require('fs');
var http = require('https');
var path = require('path');
var crypto = require('crypto');
var md5 = require('./md5.js');
var rabbit = require('./rabbit.js');

var JsonFormatter = {
        stringify: function (cipherParams) {
            var jsonObj = {
                ct: JSON.stringify(cipherParams.ciphertext)
            };

            if (cipherParams.iv) {
                jsonObj.iv = JSON.stringify(cipherParams.iv);
            }
            if (cipherParams.salt) {
                jsonObj.s = JSON.stringify(cipherParams.salt);
            }

            return JSON.stringify(jsonObj);
        },

        parse: function (jsonStr) {
            var jsonObj = JSON.parse(jsonStr);

            var cipherParams = rabbit.lib.CipherParams.create({
                ciphertext: JSON.parse(jsonObj.ct)
            });

            if (jsonObj.iv) {
                cipherParams.iv = JSON.parse(jsonObj.iv)
            }
            if (jsonObj.s) {
                cipherParams.salt = JSON.parse(jsonObj.s)
            }

            return cipherParams;
        }
    };


/*console.log(md5.MD5("").toString(md5.enc.Hex));
var encrypted = JsonFormatter.stringify(rabbit.Rabbit.encrypt("Message", ""));
var decrypted = rabbit.Rabbit.decrypt(JsonFormatter.parse(encrypted), "");
console.log(encrypted);
console.log('');
console.log(decrypted.toString(rabbit.enc.Utf8));*/
/*var privateKey  = fs.readFileSync('sslcert/server.key').toString();
var certificate = fs.readFileSync('sslcert/server.crt').toString();
var credentials = {key: privateKey, cert: certificate};
*/

var __data = {};
var __datatime = 0;
var isWin = !!process.platform.match(/^win/);

var config = {
	port: 80,
	sslport: 443,
//	process_user: 'pi',
//	process_group: 'pi'
	process_user: 1000,
	process_group: 1000
};

var express = require('express');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var compress = require('compression');
var serveStatic = require('serve-static');

var app = express();

app.set('x-powered-by', 'cs8425');

app.use(compress());
app.use(serveStatic(__dirname + '/public', { maxAge: 31557600000 }));
app.use(cookieParser());
app.use(session({ secret: 'C1e34tetf5xwcOMO-#ID@Gjkyj=OwW' }));

//app.use(passport.initialize());
//app.use(passport.session());

//app.use(express.bodyParser());
//app.use(express.methodOverride());


app.get('/', function(req, res){
	res.sendfile('index.html');
});

app.get(/^\/api\/js\/?$/, function(req, res){
	if(req.session.key){
		fs.readFile('./exec.js', function (err, data) {
			if (err){
				res.send(JsonFormatter.stringify(rabbit.Rabbit.encrypt("", req.session.key)));
			}else{
//console.log(req.session.key, data);
				res.send(JsonFormatter.stringify(rabbit.Rabbit.encrypt(data.toString(), req.session.key)));
				req.session.key = null;
			}
		});
	}else{
		req.session.key = randomString(64, '#aA!');
		console.log(req.session.key);
		res.send(JSON.stringify(req.session.key));
	}
});
app.get(/^\/api\/root\/?$/, function(req, res){
	var data = getJSON();
	//var url = req.params;
console.log('api root');
	//res.send(JSON.stringify(data.roots, null, 4));
	res.send(JSON.stringify(data.roots));
});
app.get(/^\/api\/root\/([^\/]+)\/?$/, function(req, res){
	var data = getJSON();
	var url = req.params;
console.log('api root > ',url);
	res.send(JSON.stringify(data.node_db[url[0]]));
	var t = setTimeout(rootcounteradd, 0, data.roots, url[0]);
});

app.get(/^\/api\/s\/([^\/]+)\/([^\/]+)\/?$/, function(req, res){
	var data = getJSON();
	var url = req.params;
console.log('api sub',url);
	if((data.node_db[url[0]])&&(data.node_db[url[1]])){
		res.send(JSON.stringify(data.node_db[url[1]]));
		var t = setTimeout(counteradd, 0, data.node_db[url[0]].sub, url[1]);
	}else{
		res.send('404: Page not Found', 404);
	}
});
app.get(/^\/api\/r\/([^\/]+)\/([^\/]+)\/?$/, function(req, res){
	var data = getJSON();
	var url = req.params;
console.log('api recommend',url);
	if((data.node_db[url[0]])&&(data.node_db[url[1]])){
		res.send(JSON.stringify(data.node_db[url[1]]));
		var t = setTimeout(counteradd, 0, data.node_db[url[0]].recommend, url[1]);
	}else{
		res.send('404: Page not Found', 404);
	}
});
app.get(/^\/api\/([^\/]+)\/?$/, function(req, res){
	var data = getJSON();
	var url = req.params;
console.log('api',url);
	if(data.node_db[url[0]]){
		//res.send(JSON.stringify(data.node_db[url[0]], null, 4));
		res.send(JSON.stringify(data.node_db[url[0]]));
	}else{
		res.send('404: Page not Found', 404);
	}
});

app.get(/\/([^\/]+)\/$/, function(req, res){
	var data = getJSON();
	var url = req.params;
console.log(url);
	if(data.node_db[url[0]]){
		if(data.node_db[url[0]].count){
			data.node_db[url[0]].count += 1;
		}else{
			data.node_db[url[0]].count = 1;
		}
		res.sendfile('node.html');
	}else{
		res.send('404: Page not Found', 404);
	}
});



app.use(app.router);

app.use(function(req, res, next){
  // the status option, or res.statusCode = 404
  // are equivalent, however with the option we
  // get the "status" local available as well
  //res.redirect('/index');
  res.send('404: Page not Found', 404);
  //console.log(req);
});
app.use(function(err, req, res, next){
  // we may use properties of the error object
  // here and next(err) appropriately, or if
  // we possibly recovered from the error, simply next().
  //res.redirect('/index');
  res.send(err, err.status || 500);
});


function sort_list(list, compare) {
//	console.log('sort', list, compare);
	list.sort(compare);
	return;
}

function counteradd(list, url) {
	console.log('counter_add', list, url);
	var len = list.length;

	var compare = function (a,b) {
		if(!a.count) a.count = 0;
		if(!b.count) b.count = 0;

		if (a.count < b.count)
			return 1;
		if (a.count > b.count)
			return -1;
		return 0;
	}


	for(var i = 0; i < len; i++){
		if(list[i].url == ('/' + url + '/')){
			if(list[i].count){
				list[i].count += 1;
			}else{
				list[i].count = 1;
			}
			var t = setTimeout(sort_list, 0, list, compare);
			return;
		}
	}
}
function rootcounteradd(list, url) {
	console.log('root_counter_add', list, url);
	var len = list.length;

	var compare = function (a,b) {
		if (a[3] < b[3])
			return 1;
		if (a[3] > b[3])
			return -1;
		return 0;
	}


	for(var i = 0; i < len; i++){
		if(list[i][1] == ('/' + url + '/')){
			list[i][3] += 1;
			//var t = setTimeout(sort_list, 0, list, compare);
			return;
		}
	}
}

function randomString(length, chars) {
    var mask = '';
    if (chars.indexOf('a') > -1) mask += 'abcdefghijklmnopqrstuvwxyz';
    if (chars.indexOf('A') > -1) mask += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (chars.indexOf('#') > -1) mask += '0123456789';
    if (chars.indexOf('!') > -1) mask += '~`!@#$%^&*()_+-={}[]:";\'<>?,./|\\';
    var result = '';
    for (var i = length; i > 0; --i) result += mask[Math.round(Math.random() * (mask.length - 1))];
    return result;
}

function forceSSL(req, res, next) {
	if(!req.secure){
		res.redirect('https://' + req.header('Host') + ':' + config.sslport + req.url);
	} else {
		next();
	}
}

function getJSON() {
	var now = new Date().getTime();
	if(now - __datatime > 3600*1000){
	console.log('json');
		var data = fs.readFileSync('./data.json', 'utf8');
		data = JSON.parse(data);
	//	console.log(data);
		__datatime = now;
		__data = data;
	}
	return __data;
}
function flashJSON() {
	var now = new Date().getTime();
	var data = fs.readFileSync('./data.json', 'utf8');
	data = JSON.parse(data);
//	console.log(data);
	__datatime = now;
	__data = data;
}
function flushJSONSync() {
	fs.writeFileSync('data.json', JSON.stringify(__data, null, 4));
}
function flushJSON() {
	fs.writeFile('data.json', JSON.stringify(__data, null, 4));
}


process.on('SIGTERM', function () {
	console.log('Got SIGTERM. Flush data and exit.');
	flushJSONSync();
	process.exit();
});
process.on('SIGINT', function () {
	console.log('Got SIGINT. Flush data and exit.');
	flushJSONSync();
	process.exit();
});

var save = function () {
	console.log('Flush data...');
	flushJSONSync();
	var t = setTimeout(save, 1800*1000);
};
/*
fs.watch('data.json', function(event, targetfile){
	console.log( typeof event);
	if(event == "change"){
	console.log( targetfile, 'is', event);
	}
});*/

getJSON();
save();
//var https = http.createServer(credentials, app);
//https.listen(config.sslport);

app.listen(config.port, function(){
	try {
		console.log('Giving up root privileges...');
		process.setgid(config.process_group);
		process.setuid(config.process_user);
		console.log('New uid: ' + process.getuid());
//fs.writeFileSync('new_node.json', JSON.stringify(new_node, null, 4));
	}
	catch (err) {
		console.log('Failed to drop root privileges: ' + err);
	}
});
console.log('Listening on port ' + config.port + ',' + config.sslport);

console.log(app.routes);
console.log(app.router);
//console.log(__data);



