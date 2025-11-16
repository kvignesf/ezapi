const emitSocketEvent = (req, data, eventName) => {
	try {
		const { io, listOfClients } = req.app.locals;
		const socketId = listOfClients[req.user_id];
		io.to(socketId).emit(eventName, data, (error) => {
			if (error) {
				console.log(`error while emitting socket event: ${eventName}`, error.message);
			} else {
				console.log('successfully emitted socket event', eventName);
			}
		});
	} catch (err) {
		console.log('Error Emitting socket Event', err.message);
	}
};

module.exports = emitSocketEvent;
