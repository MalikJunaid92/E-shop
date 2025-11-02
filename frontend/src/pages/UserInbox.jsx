import React, { useEffect, useRef, useState } from "react";
import Header from "../components/Layout/Header";
import { useSelector } from "react-redux";
import socketIO from "socket.io-client";
import { format } from "timeago.js";
import { server } from "../server";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { AiOutlineArrowRight, AiOutlineSend } from "react-icons/ai";
import { TfiGallery } from "react-icons/tfi";
import styles from "../styles/styles";

const ENDPOINT = "https://socket-server-89h0.onrender.com/";

const UserInbox = () => {
  const { user, loading } = useSelector((state) => state.user);
  const [conversations, setConversations] = useState([]);
  const [arrivalMessage, setArrivalMessage] = useState(null);
  const [currentChat, setCurrentChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [userData, setUserData] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [images, setImages] = useState(null);
  const [activeStatus, setActiveStatus] = useState(false);
  const [open, setOpen] = useState(false);
  const scrollRef = useRef(null);
  const [socket, setSocket] = useState(null);

  // Initialize socket
  useEffect(() => {
    const newSocket = socketIO(ENDPOINT, { transports: ["websocket"] });
    setSocket(newSocket);
    return () => newSocket.disconnect();
  }, []);

  // Listen for incoming messages
  useEffect(() => {
    if (!socket) return;
    socket.on("getMessage", (data) => {
      setArrivalMessage({
        sender: data.senderId,
        text: data.text,
        images: data.images,
        createdAt: data.createdAt || Date.now(),
      });
    });
  }, [socket]);

  // Add new message to current chat
  useEffect(() => {
    if (
      arrivalMessage &&
      currentChat?.members.includes(arrivalMessage.sender)
    ) {
      setMessages((prev) => [...prev, arrivalMessage]);
    }
  }, [arrivalMessage, currentChat]);

  // Fetch conversations
  useEffect(() => {
    if (!user) return;
    const getConversation = async () => {
      try {
        const res = await axios.get(
          `${server}/conversation/get-all-conversation-user/${user._id}`,
          { withCredentials: true }
        );
        setConversations(res.data.conversations || []);
      } catch (err) {
        console.log(err);
      }
    };
    getConversation();
  }, [user]);

  // Add user to online list
  useEffect(() => {
    if (!socket || !user) return;
    socket.emit("addUser", user._id);
    socket.on("getUsers", (data) => setOnlineUsers(data));
  }, [socket, user]);

  const onlineCheck = (chat) => {
    const otherUser = chat.members.find((m) => m !== user._id);
    return onlineUsers.some((u) => u.userId === otherUser);
  };

  // Fetch messages for current chat
  useEffect(() => {
    if (!currentChat?._id) return;
    const getMessages = async () => {
      try {
        const res = await axios.get(
          `${server}/message/get-all-messages/${currentChat._id}`,
          { withCredentials: true }
        );
        setMessages(res.data.messages || []);
      } catch (err) {
        console.log(err);
      }
    };
    getMessages();
  }, [currentChat]);

  // Send message
  const sendMessageHandler = async (e) => {
    e.preventDefault();
    if (!currentChat || !currentChat._id) {
      console.log("No conversation selected. Cannot send message.");
      return;
    }
    if (!newMessage.trim() && !images) return;

    const message = {
      sender: user._id,
      text: newMessage,
      images,
      conversationId: currentChat._id,
    };
    const receiverId = currentChat.members.find((m) => m !== user._id);

    if (socket && receiverId) {
      socket.emit("sendMessage", {
        senderId: user._id,
        receiverId,
        text: newMessage,
        images,
      });
    }

    try {
      const res = await axios.post(
        `${server}/message/create-new-message`,
        message,
        { withCredentials: true }
      );
      setMessages((prev) => [...prev, res.data.message]);
      updateLastMessage(newMessage, images ? "Photo" : newMessage);
      setNewMessage("");
      setImages(null);
    } catch (err) {
      console.log(err);
    }
  };

  // Update last message
  const updateLastMessage = async (lastMsg, displayMsg) => {
    socket.emit("updateLastMessage", {
      lastMessage: displayMsg,
      lastMessagesId: user._id,
    });
    try {
      await axios.put(
        `${server}/conversation/update-last-message/${currentChat._id}`,
        {
          lastMessage: displayMsg,
          lastMessageId: user._id,
        },
        { withCredentials: true }
      );
    } catch (err) {
      console.log(err);
    }
  };

  // Image upload
  const handleImageUpload = (e) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.readyState === 2) {
        setImages(reader.result);
      }
    };
    reader.readAsDataURL(e.target.files[0]);
  };

  // Scroll to bottom
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="w-full">
      {!open && (
        <>
          <Header />
          <h1 className="text-center text-[30px] py-3 font-Poppins">
            All Messages
          </h1>
          {conversations.length === 0 ? (
            <p className="text-center py-10 text-gray-500">
              No conversations yet.
            </p>
          ) : (
            conversations.map((item, index) => (
              <MessageList
                key={index}
                data={item}
                index={index}
                setOpen={setOpen}
                setCurrentChat={setCurrentChat}
                me={user._id}
                setUserData={setUserData}
                userData={userData}
                online={onlineCheck(item)}
                setActiveStatus={setActiveStatus}
                loading={loading}
              />
            ))
          )}
        </>
      )}

      {open && (
        <SellerInbox
          setOpen={setOpen}
          newMessage={newMessage}
          setNewMessage={setNewMessage}
          sendMessageHandler={sendMessageHandler}
          messages={messages}
          sellerId={user._id}
          userData={userData}
          activeStatus={activeStatus}
          scrollRef={scrollRef}
          handleImageUpload={handleImageUpload}
        />
      )}
    </div>
  );
};

// MessageList Component
const MessageList = ({
  data,
  index,
  setOpen,
  setCurrentChat,
  me,
  setUserData,
  userData,
  online,
  setActiveStatus,
  loading,
}) => {
  const [active, setActive] = useState(0);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    setActiveStatus(online);
    const userId = data.members.find((id) => id !== me);
    const getUser = async () => {
      if (!userId) return;
      try {
        const res = await axios.get(`${server}/shop/get-shop-info/${userId}`, {
          withCredentials: true,
        });
        setUser(res.data.shop);
      } catch (err) {
        console.log(err);
      }
    };
    getUser();
  }, [me, data]);

  const handleClick = () => {
    // ensure userData is fetched before opening the chat
    (async () => {
      try {
        setActive(index);
        setCurrentChat(data);
        setActiveStatus(online);
        const userId = data.members.find((id) => id !== me);
        if (userId) {
          const res = await axios.get(
            `${server}/shop/get-shop-info/${userId}`,
            {
              withCredentials: true,
            }
          );
          setUser(res.data.shop);
          setUserData(res.data.shop);
        } else {
          setUser(null);
          setUserData(null);
        }
      } catch (err) {
        console.log("Failed to fetch chat user:", err);
      } finally {
        setOpen(true);
        navigate(`/inbox?${data._id}`);
      }
    })();
  };

  return (
    <div
      className={`w-full flex p-3 px-3 ${
        active === index ? "bg-[#00000010]" : "bg-transparent"
      } cursor-pointer`}
      onClick={handleClick}
    >
      <div className="relative">
        <img
          src={user?.avatar?.url}
          alt=""
          className="w-[50px] h-[50px] rounded-full"
        />
        {online ? (
          <div className="w-[12px] h-[12px] bg-green-400 rounded-full absolute top-[2px] right-[2px]" />
        ) : (
          <div className="w-[12px] h-[12px] bg-[#c7b9b9] rounded-full absolute top-[2px] right-[2px]" />
        )}
      </div>
      <div className="pl-3">
        <h1 className="text-[18px]">{user?.name}</h1>
        <p className="text-[16px] text-[#000c]">
          {!loading && data?.lastMessageId !== userData?._id
            ? "You:"
            : userData?.name?.split(" ")[0] + ":"}{" "}
          {data?.lastMessage}
        </p>
      </div>
    </div>
  );
};

// SellerInbox Component
const SellerInbox = ({
  setOpen,
  newMessage,
  setNewMessage,
  sendMessageHandler,
  messages,
  sellerId,
  userData,
  activeStatus,
  scrollRef,
  handleImageUpload,
}) => (
  <div className="w-[full] min-h-full flex flex-col justify-between p-5">
    <div className="w-full flex p-3 items-center justify-between bg-slate-200">
      <div className="flex">
        <img
          src={userData?.avatar?.url}
          alt=""
          className="w-[60px] h-[60px] rounded-full"
        />
        <div className="pl-3">
          <h1 className="text-[18px] font-[600]">{userData?.name}</h1>
          <h1>{activeStatus ? "Active Now" : ""}</h1>
        </div>
      </div>
      <AiOutlineArrowRight
        size={20}
        className="cursor-pointer"
        onClick={() => setOpen(false)}
      />
    </div>

    <div className="px-3 h-[75vh] py-3 overflow-y-scroll">
      {messages.length === 0 ? (
        <p className="text-center py-10 text-gray-500">No messages yet.</p>
      ) : (
        messages.map((item, index) => (
          <div
            key={index}
            className={`flex w-full my-2 ${
              item.sender === sellerId ? "justify-end" : "justify-start"
            }`}
            ref={scrollRef}
          >
            {item.sender !== sellerId && (
              <img
                src={userData?.avatar?.url}
                className="w-[40px] h-[40px] rounded-full mr-3"
                alt=""
              />
            )}
            {item.images && (
              <img
                src={item.images?.url || item.images}
                className="w-[300px] h-[300px] object-cover rounded-[10px] ml-2 mb-2"
              />
            )}
            {item.text && (
              <div>
                <div
                  className={`w-max p-2 rounded ${
                    item.sender === sellerId ? "bg-[#000]" : "bg-[#38c776]"
                  } text-[#fff] h-min`}
                >
                  <p>{item.text}</p>
                </div>
                <p className="text-[12px] text-[#000000d3] pt-1">
                  {format(item.createdAt)}
                </p>
              </div>
            )}
          </div>
        ))
      )}
    </div>

    <form
      className="p-3 relative w-full flex justify-between items-center"
      onSubmit={sendMessageHandler}
    >
      <div className="w-[30px]">
        <input
          type="file"
          id="image"
          className="hidden"
          onChange={handleImageUpload}
        />
        <label htmlFor="image">
          <TfiGallery className="cursor-pointer" size={20} />
        </label>
      </div>
      <div className="w-full relative">
        <input
          type="text"
          placeholder="Enter your message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          className={`${styles.input}`}
        />
        <input type="submit" value="Send" className="hidden" id="send" />
        <label htmlFor="send">
          <AiOutlineSend
            size={20}
            className="absolute right-4 top-5 cursor-pointer"
          />
        </label>
      </div>
    </form>
  </div>
);

export default UserInbox;
