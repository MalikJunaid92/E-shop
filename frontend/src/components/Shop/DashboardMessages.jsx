import axios from "axios";
import React, { useRef, useState } from "react";
import { useEffect } from "react";
import { server } from "../../server";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { AiOutlineArrowRight, AiOutlineSend } from "react-icons/ai";
import styles from "../../styles/styles";
import { TfiGallery } from "react-icons/tfi";
import socketIO from "socket.io-client";
import { format } from "timeago.js";
// Socket endpoint can be configured via environment variable for deployed socket
// servers (e.g. REACT_APP_SOCKET_ENDPOINT). Fallback to localhost for dev.
const ENDPOINT =
  process.env.REACT_APP_SOCKET_ENDPOINT ||
  "https://socket-server-89h0.onrender.com/";
// const socket = socketIO(ENDPOINT, { transports: ["websocket"] });

const DashboardMessages = () => {
  const { seller, isLoading } = useSelector((state) => state.seller);
  const [conversations, setConversations] = useState([]);
  const [arrivalMessage, setArrivalMessage] = useState(null);
  const [currentChat, setCurrentChat] = useState();
  const [messages, setMessages] = useState([]);
  const [userData, setUserData] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [activeStatus, setActiveStatus] = useState(false);
  const [images, setImages] = useState();
  const [open, setOpen] = useState(false);
  const scrollRef = useRef(null);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const newSocket = socketIO(ENDPOINT, { transports: ["websocket"] });
    setSocket(newSocket);

    return () => newSocket.disconnect();
  }, []);

  useEffect(() => {
    if (!socket) return;
    const handleGetMessage = (data) => {
      // server may send senderId or sender, accept both
      const senderId = data.sender || data.senderId;
      setArrivalMessage({
        sender: senderId,
        text: data.text || "",
        images: data.images || null,
        createdAt: data.createdAt || Date.now(),
      });
    };

    socket.on("getMessage", handleGetMessage);
    return () => {
      socket.off("getMessage", handleGetMessage);
    };
  }, [socket]);

  useEffect(() => {
    if (!arrivalMessage) return;
    const isForCurrent = currentChat?.members?.includes(arrivalMessage.sender);
    if (isForCurrent) {
      setMessages((prev) => [...prev, arrivalMessage]);
      // also update lastMessage for the current conversation in list for realtime UI
      setConversations((prev) =>
        prev.map((c) =>
          c._id === currentChat._id
            ? {
                ...c,
                lastMessage:
                  arrivalMessage.text ||
                  (arrivalMessage.images ? "Photo" : c.lastMessage),
                lastMessageId: arrivalMessage.sender,
              }
            : c
        )
      );
    } else {
      // message for another conversation: try to update that conversation's lastMessage
      setConversations((prev) =>
        prev.map((c) => {
          // if the sender is part of this conversation, update its lastMessage
          const isMember = c?.members?.includes(arrivalMessage.sender);
          if (isMember) {
            return {
              ...c,
              lastMessage:
                arrivalMessage.text ||
                (arrivalMessage.images ? "Photo" : c.lastMessage),
              lastMessageId: arrivalMessage.sender,
            };
          }
          return c;
        })
      );
    }
  }, [arrivalMessage, currentChat]);

  useEffect(() => {
    const getConversation = async () => {
      if (!seller?._id) return;
      try {
        const resonse = await axios.get(
          `${server}/conversation/get-all-conversation-seller/${seller?._id}`,
          {
            withCredentials: true,
          }
        );

        setConversations(resonse.data.conversations || []);
      } catch (error) {
        // console.log(error);
      }
    };
    getConversation();
  }, [seller]);

  useEffect(() => {
    if (!socket || !seller) return;
    const sellerId = seller?._id;
    socket.emit("addUser", sellerId);
    const handleGetUsers = (data) => setOnlineUsers(data);
    socket.on("getUsers", handleGetUsers);
    return () => {
      socket.off("getUsers", handleGetUsers);
    };
  }, [seller, socket]);

  const onlineCheck = (chat) => {
    const chatMembers = chat.members.find((member) => member !== seller?._id);
    const online = onlineUsers.find((user) => user.userId === chatMembers);

    return online ? true : false;
  };

  // get messages
  useEffect(() => {
    const getMessage = async () => {
      if (!currentChat?._id) return; // guard: don't call API with undefined id
      try {
        const response = await axios.get(
          `${server}/message/get-all-messages/${currentChat._id}`,
          { withCredentials: true }
        );
        setMessages(response.data.messages || []);
      } catch (error) {
        console.log(error);
      }
    };
    getMessage();
  }, [currentChat]);

  // create new message
  const sendMessageHandler = async (e) => {
    e.preventDefault();
    if (!currentChat || !currentChat._id) {
      console.log("No conversation selected. Cannot send message.");
      return;
    }

    const message = {
      sender: seller._id,
      text: newMessage,
      conversationId: currentChat._id,
    };

    const receiverId = currentChat.members.find(
      (member) => member !== seller._id
    );

    if (!receiverId) {
      console.log("No receiver found for this conversation.");
    } else if (socket) {
      socket.emit("sendMessage", {
        senderId: seller._id,
        receiverId,
        text: newMessage,
      });
    }

    try {
      if (newMessage !== "") {
        const res = await axios.post(
          `${server}/message/create-new-message`,
          message,
          { withCredentials: true }
        );
        setMessages((prev) => [...prev, res.data.message]);
        setNewMessage("");
        // updateLastMessage();
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleImageUpload = async (e) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (reader.readyState === 2) {
        setImages(reader.result);
        imageSendingHandler(reader.result);
      }
    };

    reader.readAsDataURL(e.target.files[0]);
  };

  const imageSendingHandler = async (e) => {
    const receiverId = currentChat.members.find(
      (member) => member !== seller._id
    );

    socket.emit("sendMessage", {
      senderId: seller._id,
      receiverId,
      images: e,
    });

    try {
      const res = await axios.post(
        `${server}/message/create-new-message`,
        {
          images: e,
          sender: seller._id,
          text: newMessage,
          conversationId: currentChat._id,
        },
        { withCredentials: true }
      );
      setImages();
      setMessages((prev) => [...prev, res.data.message]);
      updateLastMessageForImage();
    } catch (error) {
      console.log(error);
    }
  };

  const updateLastMessageForImage = async () => {
    try {
      await axios.put(
        `${server}/conversation/update-last-message/${currentChat._id}`,
        {
          lastMessage: "Photo",
          lastMessagesId: seller._id,
        },
        { withCredentials: true }
      );
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="w-[90%] bg-white m-5 h-[85vh] overflow-y-scroll rounded">
      {!open && (
        <>
          <h1 className="text-center text-[30px] py-3 font-Poppins">
            All Messages
          </h1>
          {/* All messages list */}
          {conversations &&
            conversations.map((item, index) => (
              <MessageList
                data={item}
                key={index}
                index={index}
                setOpen={setOpen}
                setCurrentChat={setCurrentChat}
                me={seller._id}
                setUserData={setUserData}
                userData={userData}
                online={onlineCheck(item)}
                setActiveStatus={setActiveStatus}
                isLoading={isLoading}
              />
            ))}
        </>
      )}

      {open && (
        <SellerInbox
          setOpen={setOpen}
          newMessage={newMessage}
          setNewMessage={setNewMessage}
          sendMessageHandler={sendMessageHandler}
          messages={messages}
          sellerId={seller._id}
          userData={userData}
          activeStatus={activeStatus}
          scrollRef={scrollRef}
          setMessages={setMessages}
          handleImageUpload={handleImageUpload}
        />
      )}
    </div>
  );
};

const MessageList = ({
  data,
  index,
  setOpen,
  setCurrentChat,
  me,
  setUserData,
  online,
  setActiveStatus,
  isLoading,
}) => {
  console.log(data);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const [active, setActive] = useState(-1);

  // Click handler: set active chat, fetch the other user's info (if needed),
  // then open the chat and navigate.
  const handleClick = async (id) => {
    try {
      setActive(index);
      setCurrentChat(data);
      setActiveStatus(online);
      // fetch the other user's data to ensure userData is available when opening
      const userId = data.members.find((userId) => userId !== me);
      if (userId) {
        const res = await axios.get(`${server}/user/user-info/${userId}`, {
          withCredentials: true,
        });
        setUser(res.data.user);
        setUserData(res.data.user);
      } else {
        setUser(null);
        setUserData(null);
      }
      setOpen(true);
      navigate(`/dashboard-messages?${id}`);
    } catch (error) {
      console.log("Failed to open conversation:", error);
      // still try to open with what we have
      setOpen(true);
      setCurrentChat(data);
      navigate(`/dashboard-messages?${id}`);
    }
  };

  useEffect(() => {
    // keep a best-effort background fetch so avatar/name can display in list
    const userId = data.members.find((user) => user != me);

    const getUser = async () => {
      if (!userId) return;
      try {
        const res = await axios.get(`${server}/user/user-info/${userId}`, {
          withCredentials: true,
        });
        setUser(res.data.user);
      } catch (error) {
        console.log(error);
      }
    };
    getUser();
  }, [me, data]);

  return (
    <div
      className={`w-full flex p-3 px-3 ${
        active === index ? "bg-[#00000010]" : "bg-transparent"
      }  cursor-pointer`}
      onClick={() => handleClick(data._id)}
    >
      <div className="relative">
        <img
          src={`${user?.avatar?.url}`}
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
          {!isLoading && data?.lastMessageId !== user?._id
            ? "You:"
            : user?.name.split(" ")[0] + ": "}{" "}
          {data?.lastMessage}
        </p>
      </div>
    </div>
  );
};

const SellerInbox = ({
  scrollRef,
  setOpen,
  newMessage,
  setNewMessage,
  sendMessageHandler,
  messages,
  sellerId,
  userData,
  activeStatus,
  handleImageUpload,
}) => {
  return (
    <div className="w-full min-h-full flex flex-col justify-between">
      {/* message header */}
      <div className="w-full flex p-3 items-center justify-between bg-slate-200">
        <div className="flex">
          <img
            src={`${userData?.avatar?.url}`}
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

      {/* messages */}
      <div className="px-3 h-[65vh] py-3 overflow-y-scroll">
        {messages &&
          messages.map((item, index) => {
            return (
              <div
                className={`flex w-full my-2 ${
                  item.sender === sellerId ? "justify-end" : "justify-start"
                }`}
                ref={scrollRef}
              >
                {item.sender !== sellerId && (
                  <img
                    src={`${userData?.avatar?.url}`}
                    className="w-[40px] h-[40px] rounded-full mr-3"
                    alt=""
                  />
                )}
                {item.images && (
                  <img
                    src={`${item.images?.url}`}
                    className="w-[300px] h-[300px] object-cover rounded-[10px] mr-2"
                  />
                )}
                {item.text !== "" && (
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
            );
          })}
      </div>

      {/* send message input */}
      <form
        aria-required={true}
        className="p-3 relative w-full flex justify-between items-center"
        onSubmit={sendMessageHandler}
      >
        <div className="w-[30px]">
          <input
            type="file"
            name=""
            id="image"
            className="hidden"
            onChange={handleImageUpload}
          />
          <label htmlFor="image">
            <TfiGallery className="cursor-pointer" size={20} />
          </label>
        </div>
        <div className="w-full">
          <input
            type="text"
            required
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
};

export default DashboardMessages;
