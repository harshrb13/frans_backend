const express = require('express');
const cors = require('cors');
const cookieParser = require("cookie-parser");
const errorMiddleware = require("./middlewares/error")
const http = require("http")
const {Server} = require("socket.io")

const app = express();
const server = http.createServer(app)

const io = new Server(server,{
    cors:{
        origin:"*",
        methods:["GET","POST"]
    }
})

app.use((req,res,next)=>{
    res.locals.io = io;
    next();
})

io.on("connection",(socket)=>{
    console.log(`Socket Connected: ${socket.id}`)

    socket.on("join_user_room",(userId)=>{
        if (!userId) return;
        console.log(`Socket ${socket.id} joining room for user ${userId}`)
        socket.join(userId.toString());
    })

    socket.on("disconnect",()=>{
        console.log(`Socket disconnected: ${socket.id}`)
    })
})

// Middlewares
// app.use(cors({
//     origin:[`${process.env.FRONTEND_URI}`],
//     credentials:true
// }));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes
const userRoute = require("./router/userRouter.js");
const optionsRoute = require("./router/optionRouter.js");
const productRoute = require("./router/productRouter.js");
const tryOnRoute = require("./router/tryOnRouter.js")
const bannerRoute = require("./router/bannerRouter.js");
const wishlistRoute = require("./router/wishlistRouter.js");
const storeRoute = require("./router/storeRouter.js");
const reviewRoute = require("./router/reviewRouter.js");
const notificationRoute = require("./router/notificationRouter.js");

app.use("/api/v1",userRoute)
app.use("/api/v1",optionsRoute)
app.use("/api/v1",productRoute)
app.use("/api/v1",tryOnRoute)
app.use("/api/v1",bannerRoute)
app.use("/api/v1",wishlistRoute)
app.use("/api/v1",storeRoute)
app.use("/api/v1",reviewRoute)
app.use("/api/v1",notificationRoute)

// error 
app.use(errorMiddleware)

// Export app for use in server or tests
module.exports = {app,server};



