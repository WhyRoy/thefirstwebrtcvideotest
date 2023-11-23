import express from "express";
import { log } from "node:console";
import { createServer } from "node:http";
import { Server } from "socket.io";

const app = express();
const server = createServer(app);
const io = new Server(server);

app.get("/", (req, res) => {
  res.sendFile(new URL("./public/index.html", import.meta.url).pathname);
});

io.on("connection", (socket) => {
  console.log("a user connected");
  socket.on("disconnect", () => {
    console.log("user disconnected");
  });

  // 加入的逻辑
  socket.on("join", (roomName) => {
    // 获取room中已经有多少个人了，这是一个Map集合
    let rooms = io.sockets.adapter.rooms;
    console.log(rooms);
    // 获取room对象
    let room = rooms.get(roomName);
    console.log("room:", room);
    console.log("roomName:", roomName);

    // 设置room最多能容纳两个人
    if (room == undefined) {
      socket.join(roomName);
      // log是在服务端打印，客户端并不知道，所以在这log是没有用的
      console.log("room created");
      let room = rooms.get(roomName);
      console.log("room after created", room);
      console.log("room size now", room.size);
      socket.emit("Created");
    } else if (room.size == 1) {
      socket.join(roomName);
      console.log("room joined");
      console.log("room size now", room.size);
      socket.emit("Joined");
    } else {
      console.log("room fulled");
      socket.emit("Fulled");
    }
    // console.log(rooms.size);
    // console.log("message: " + roomName);
    // io.emit("join", roomName);
  });

  // 加入者ready的逻辑
  socket.on("ready", (roomName) => {
    console.log("ready");
    // 广播，除了自己都能收到
    socket.broadcast.to(roomName).emit("ready");
  });

  // 发起者知道加入者ready之后，需要交换ICE candidate等，即彼此的通信方式（内网、公网？）
  socket.on("candidate", (candidate, roomName) => {
    console.log("candidate", candidate);
    // 广播，除了自己都能收到
    socket.broadcast.to(roomName).emit("candidate", candidate);
  });

  // 交换ice之后，发起者还需要提供offer，offer基本上是SDP，描述两者之间传递的数据类型，video or audio
  socket.on("offer", (offer, roomName) => {
    console.log("offer");
    // 广播，除了自己都能收到
    socket.broadcast.to(roomName).emit("offer", offer);
  });

  // 接到发起者提供的offer后，加入者还需要提供answer
  socket.on("answer", (answer, roomName) => {
    console.log("answer");
    // 广播，除了自己都能收到
    socket.broadcast.to(roomName).emit("answer", answer);
  });
});

server.listen(3000, () => {
  console.log("server running at http://localhost:3000");
});
