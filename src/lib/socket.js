let ioInstance = null;

export function setSocketServer(io) {
  ioInstance = io;
}

export function emitAdminEvent(event, payload) {
  if (!ioInstance) return;
  ioInstance.to("admin").emit(event, payload);
}
