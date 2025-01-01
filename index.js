const { default: axios } = require("axios")
WebSocket = require("ws")
require("dotenv").config()

const API_KEY = process.env.API_KEY; 
const CHANNEL_ID = process.env.CHANNEL_ID; 
const PORT = process.env.PORT || 8080;

let nextPageToken;
let requestInterval = 5000;
let chatId;


const getCurrentLiveStreamId = async () => {
    try {
      const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${CHANNEL_ID}&type=video&eventType=live&key=${API_KEY}`;
      const response = await axios.get(url);
  
      const liveVideo = response.data.items[0];
      if (liveVideo) {
        console.log(`Current Live Video ID: ${liveVideo.id.videoId}`);
        return liveVideo.id.videoId;
      } else {
        console.log("No live streams are currently active.");
        return null;
      }
    } catch (error) {
      console.error("Error fetching current live stream ID:", error.message);
      return null;
    }
  };


  const getLiveChatId = async (videoId) => {
    try {
      const url = `https://www.googleapis.com/youtube/v3/videos?part=liveStreamingDetails&id=${videoId}&key=${API_KEY}`;
      const response = await axios.get(url);
      const chatId = response.data.items[0]?.liveStreamingDetails?.activeLiveChatId;
      if (chatId) {
        console.log(`Live Chat ID: ${chatId}`);
      } else {
        console.log("No live chat available for this video.");
      }
      return chatId;
    } catch (error) {
      console.error("Error fetching live chat ID:", error.message);
      return null;
    }
  };


  const fetchLiveChatMessages = async () => {
    if (!chatId) return [];
  
    try {
      const url = `https://www.googleapis.com/youtube/v3/liveChat/messages?liveChatId=${chatId}&part=snippet,authorDetails&key=${API_KEY}${
        nextPageToken ? `&pageToken=${nextPageToken}` : ""
      }`;
      console.log(`Fetching YouTube chat messages...`)
      const response = await axios.get(url);
  
      const messages = response.data.items.map((item) => ({
        author: item.authorDetails.displayName,
        message: item.snippet.displayMessage,
        timestamp: item.snippet.publishedAt,
      }));
      
      console.log(`Recieved ${messages.length} messages`)
      nextPageToken = response.data.nextPageToken;
      requestInterval = response.data.pollingIntervalMillis || 5000;
      console.log(`The next message fetch will be in ${requestInterval}`)
  
      return messages;
    } catch (error) {
      console.error("Error fetching live chat messages:", error.message);
      return [];
    }
  };

  const startWebSocketServer = () => {
    let process;
    const wss = new WebSocket.Server({ port: PORT });
    console.log(`Websocket Started on port: ${PORT}`)

    wss.on('connection', (ws) => {
      console.log('Client connected.');
  
      const sendChatMessages = async () => {
        const messages = await fetchLiveChatMessages();
        if (messages.length > 0) {
          ws.send(JSON.stringify(messages));
        }
        
        process = setTimeout(sendChatMessages, requestInterval);
        console.log(`Messages: \n ${messages}`)
      };
  
      sendChatMessages();
      ws.on('close', () => {
        console.log('Client disconnected.');
        clearTimeout(process);
      });
    });
  };

  const main = async () => {
    const videoId = await getCurrentLiveStreamId();
    if (!videoId) {
      console.error("No active live streams found. Exiting...");
      return;
    }
  
    chatId = await getLiveChatId(videoId);
    if (!chatId) {
      console.error("No live chat found for the current stream. Exiting...");
      return;
    }
  
    startWebSocketServer();
  };
  
  main();