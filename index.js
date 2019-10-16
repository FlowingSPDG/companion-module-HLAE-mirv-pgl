//var tcp = require('../../tcp');
var instance_skel = require('../../instance_skel');
var debug;
var log;

function instance(system, id, config) {
	var self = this;

	// super-constructor
	instance_skel.apply(this, arguments);

	self.actions(); // export actions
	self.init_presets();

	return self;
}

instance.prototype.updateConfig = function(config) {
	var self = this;
	self.init_presets();

	self.config = config;
	self.init_pgl();
	self.actions();

};

instance.prototype.init = function() {
	var self = this;

	debug = self.debug;
	log = self.log;
	self.init_presets();
	self.init_pgl();
};

instance.prototype.init_pgl = function() {
	var self = this;

	if (self.pgl !== undefined) {
		self.pgl.wss.close();
		self.pgl.server.close()
		delete self.pgl;
	}

	if (self.pgl === undefined && self.config.port && self.config.path) {
		const mirvpgl = require("./mirvpgl").default;
		self.pgl = new mirvpgl(self.config.port, self.config.path); 
		self.status(0,'Waiting for connection... :' + self.config.port + self.config.path);

		self.pgl.wss.on('connection', function () {
			self.debug("Client connected");
			self.status(0,'Client connected!'); // status ok!
		})
		self.pgl.wss.on('close', function () {
			self.debug("Connection closed");
			self.status(0,'Client disconnected!'); // status ok!
		})
		self.pgl.wss.on('error', function () {
			self.log("Client error!");
			self.status(2,'Client error!!'); // status ok!
		})
		
	}
};


// Return config fields for web config
instance.prototype.config_fields = function () {
	var self = this;
	return [
		{
			type: 'textinput',
			id: 'port',
			label: 'Target Port (Default: 31337)',
			width: 3,
			default: 31337,
		},
		{
			type: 'textinput',
			id: 'path',
			label: 'Host ws path (Default: /mirv)',
			width: 5,
			default: '/mirv',
		}
	]
};

instance.prototype.CHOICES_COMMANDS = [
	{ id: 'command',					size: '14', label: 'Custom Command' },
];

instance.prototype.init_presets = function () {
	var self = this;
	var presets = [];
	for (var input in self.CHOICES_COMMANDS) {
		presets.push({
			category: 'Commands',
			label: self.CHOICES_COMMANDS[input].label,
			bank: {
				style: 'text',
				text: self.CHOICES_COMMANDS[input].label,
				size: self.CHOICES_COMMANDS[input].size,
				color: '16777215',
				bgcolor: self.rgb(0,0,0)
			},
			actions: [{
				action: self.CHOICES_COMMANDS[input].id,
			}]
		})
	}

	self.setPresetDefinitions(presets);
}

// When module gets deleted
instance.prototype.destroy = function() {
	var self = this;

	if (self.pgl !== undefined) {
		self.pgl.wss.close();
		self.pgl.server.close()
		delete self.pgl;
	}

	self.debug("destroy", self.id);
};


instance.prototype.actions = function(system) {
	var self = this;

	self.system.emit('instance_actions', self.id, {
		'command': {
			label: 'Execute command to connected clients',
			options: [
				{
					type: 'textinput',
					label: 'Command',
					id: 'command',
					default: 'echo Hello from companion'
				}
			]
		}
	});
};

	instance.prototype.action = function(action) {
		var self = this;
		var opt = action.options
		var cmd = ''
		switch (action.action) {
			case 'command':
				cmd = opt.command;
				break;
	};
	if (cmd !== undefined) {
		self.log('sending ',cmd);
		if (self.pgl !== undefined) {
			self.pgl.sendcommand(cmd);
		} else {
			debug('Socket not connected :(');
		}
	}


};
instance_skel.extendedBy(instance);
exports = module.exports = instance;
