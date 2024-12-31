const WebSocket = require("ws")

const ws = new WebSocket('wss://computer-craft-chat.fly.dev');
ws.onopen = () => console.log('Connected');
ws.onmessage = (message) => console.log('Received:', message.data);
ws.onerror = (error) => console.error('WebSocket error:', error);
ws.onclose = () => console.log('Connection closed');
