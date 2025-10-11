import React, { useEffect, useState, useRef, useCallback } from "react";
import axios from "../../../services/axiosInstance";
import SockJS from "sockjs-client";
import { Stomp } from "@stomp/stompjs";
import "./TinNhan.css";
/* eslint-disable react-hooks/exhaustive-deps */

const TinNhan = () => {
  const [user, setUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [sending, setSending] = useState(false);
  const [stompClient, setStompClient] = useState(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [userCache, setUserCache] = useState({}); 
  
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null); 
  const subscriptionRef = useRef(null);
  const currentConversationRef = useRef(null);
  
  const idNguoiDung = localStorage.getItem("idNguoiDung");
  const jwt = localStorage.getItem("jwt");


  useEffect(() => {
    currentConversationRef.current = currentConversation;
  }, [currentConversation]);

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const isCustomer = (role) => {
    return role === 'KHACHHANG';
  };

  const isStaff = (role) => {
    return ['ADMIN', 'QUANLY', 'NHANVIEN_QUANLYDONHANG', 'NHANVIEN_QUANLYMONAN'].includes(role);
  };

 
  const updateConversationLastMessage = useCallback((message) => {
    if (!isStaff(user?.vaiTro)) return;
    
    setConversations(prevConversations => {
      const updatedConversations = prevConversations.map(conv => {
       
        if (conv.id === message.hoiThoai?.id) {
          return {
            ...conv,
            tinNhanCuoiCung: message.noiDung,
            thoiGianTinNhanCuoi: message.thoiGianTao
          };
        }
        return conv;
      });
      
    
      return updatedConversations.sort((a, b) => {
        const timeA = new Date(a.thoiGianTinNhanCuoi || a.thoiGianTao);
        const timeB = new Date(b.thoiGianTinNhanCuoi || b.thoiGianTao);
        return timeB - timeA;
      });
    });
  }, [user?.vaiTro]);


  const handleReceivedMessage = useCallback((message) => {
    const receivedMessage = JSON.parse(message.body);
    
 
    updateConversationLastMessage(receivedMessage);
    
  
    if (currentConversationRef.current && 
        receivedMessage.hoiThoai && 
        receivedMessage.hoiThoai.id === currentConversationRef.current.id &&
        receivedMessage.nguoiGuiId.toString() !== idNguoiDung) {
      
      setMessages(prev => {
       
        const exists = prev.some(msg => msg.id === receivedMessage.id);
        if (!exists) {
          return [...prev, receivedMessage];
        }
        return prev;
      });
    }
  }, [idNguoiDung, updateConversationLastMessage]);


  const connectWebSocket = useCallback(() => {
    if (stompClient && stompClient.connected) {
      return stompClient;
    }

    if (connecting) {
      return null;
    }

    setConnecting(true);
    
    try {
      const socket = new SockJS('http://localhost:8080/ws');
      const client = Stomp.over(socket);
      
      client.connect({}, 
        (frame) => {
          setStompClient(client);
          setConnecting(false);
          
          try {
            const subscription = client.subscribe('/topic/public', handleReceivedMessage);
            subscriptionRef.current = subscription;
          } catch (subError) {
            console.error("❌ Lỗi khi đăng ký subscription:", subError);
          }
        }, 
        (error) => {
          console.error('❌ Lỗi kết nối WebSocket:', error);
          setConnecting(false);
          setStompClient(null);
          
        
          setTimeout(() => {
            if (!stompClient || !stompClient.connected) {
              connectWebSocket();
            }
          }, 3000);
        }
      );

      return client;
    } catch (error) {
      console.error("❌ Exception khi tạo WebSocket:", error);
      setConnecting(false);
      return null;
    }
  }, [stompClient?.connected, connecting, handleReceivedMessage]);


  // const disconnectWebSocket = useCallback(() => {
  //   if (subscriptionRef.current) {
  //     subscriptionRef.current.unsubscribe();
  //     subscriptionRef.current = null;
  //   }
    
  //   if (stompClient && stompClient.connected) {
  //     stompClient.disconnect();
  //   }
  //   setStompClient(null);
  // }, [stompClient]);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!idNguoiDung || !jwt) return;

      try {
        const response = await axios.get(`/nguoi-dung/secure/${idNguoiDung}`, {
          headers: {
            Authorization: `Bearer ${jwt}`,
          },
        });
        
        setUser(response.data);
        
        if (isCustomer(response.data.vaiTro)) {
          loadCustomerChat();
        } else if (isStaff(response.data.vaiTro)) {
          loadAllConversations();
        }
      } catch (error) {
        console.error("Lỗi khi lấy thông tin người dùng:", error);
      }
    };

    fetchUserData();
  }, [idNguoiDung, jwt]);


  useEffect(() => {
    if (!user) {
      return;
    }

   
    if (isStaff(user.vaiTro)) {
      if (!stompClient || !stompClient.connected) {
        connectWebSocket();
      }
    }
    
   
    if (isCustomer(user.vaiTro) && currentConversation) {
      if (!stompClient || !stompClient.connected) {
        connectWebSocket();
      }
    }

  
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
      
      if (stompClient && stompClient.connected) {
        stompClient.disconnect();
      }
      setStompClient(null);
    };
  }, []);


  useEffect(() => {
    if (!user) return;

 
    if (isStaff(user.vaiTro) && (!stompClient || !stompClient.connected)) {
      connectWebSocket();
    }
  }, [user, stompClient?.connected]);

  
  useEffect(() => {
    if (!user || !isCustomer(user.vaiTro)) return;

 
    if (currentConversation && (!stompClient || !stompClient.connected)) {
      connectWebSocket();
    }
  }, [user, currentConversation, stompClient?.connected]);
  
  const loadCustomerChat = async () => {
    try {
      const response = await axios.get('/tin-nhan/chat', {
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      });
      
      setCurrentConversation(response.data.hoiThoai);
      setMessages(response.data.tinNhanList || []);
      
   
      if (user && isCustomer(user.vaiTro) && (!stompClient || !stompClient.connected)) {
        connectWebSocket();
      }
      
      return response.data.hoiThoai;
    } catch (error) {
      console.error("Lỗi khi tải chat:", error);
      return null;
    }
  };

  const loadAllConversations = async () => {
    try {
      const response = await axios.get('/tin-nhan/hoi-thoai/all', {
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      });
      
  
      const sortedConversations = (response.data || []).sort((a, b) => {
        const timeA = new Date(a.thoiGianTinNhanCuoi || a.thoiGianTao);
        const timeB = new Date(b.thoiGianTinNhanCuoi || b.thoiGianTao);
        return timeB - timeA;
      });
      
      setConversations(sortedConversations);
    } catch (error) {
      console.error(" Lỗi khi tải danh sách hội thoại:", error);
    }
  };

  const loadChatWithCustomer = async (customerId) => {
    try {
      setLoading(true);
      const response = await axios.get(`/tin-nhan/chat/${customerId}`, {
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      });
      
    
      setCurrentConversation(response.data.hoiThoai);
      setMessages(response.data.tinNhanList || []);
      setSelectedCustomerId(customerId);
    } catch (error) {
      console.error("Lỗi khi tải chat với khách hàng:", error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    setSending(true);
    const messageContent = newMessage.trim(); 
    setNewMessage(""); 

    try {
      let conversationToUse = currentConversation;
      
      if (isCustomer(user.vaiTro) && !conversationToUse) {
        conversationToUse = await loadCustomerChat();
        if (!conversationToUse) {
          throw new Error("Không thể tạo hoặc tải hội thoại");
        }
        setCurrentConversation(conversationToUse); 
      }
    
      if (conversationToUse) {
        await sendActualMessage(conversationToUse, messageContent);
      }
    } catch (error) {
      console.error("Lỗi khi gửi tin nhắn:", error);
      setNewMessage(messageContent);
      alert("Không thể gửi tin nhắn. Vui lòng thử lại!");
    } finally {
      setSending(false);
    }
  };

  const sendActualMessage = async (conversation, messageContent) => {
    const messageData = {
      hoiThoaiId: conversation.id,
      noiDung: messageContent
    };

    try {
      const response = await axios.post('/tin-nhan/gui', messageData, {
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      });

      setMessages(prev => [...prev, response.data]);

     
      updateConversationLastMessage(response.data);

      if (stompClient && stompClient.connected) {
        stompClient.send('/app/sendMessage', {}, JSON.stringify(response.data));
      }

    } catch (error) {
      console.error("Lỗi khi gửi tin nhắn thực tế:", error);
      throw error; 
    }
  };

 

  const formatTime = (dateTime) => {
    return new Date(dateTime).toLocaleString('vi-VN');
  };


  const formatLastMessageTime = (dateTime) => {
    const now = new Date();
    const messageTime = new Date(dateTime);
    const diffInMinutes = Math.floor((now - messageTime) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Vừa xong';
    if (diffInMinutes < 60) return `${diffInMinutes} phút`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} giờ`;
    return messageTime.toLocaleDateString('vi-VN');
  };

  const fetchUserById = async (userId) => {
    if (userCache[userId]) {
      return userCache[userId];
    }

    try {
      const response = await axios.get(`/nguoi-dung/secure/${userId}`, {
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      });
      
      const userData = response.data;
      setUserCache(prev => ({
        ...prev,
        [userId]: userData
      }));
      
      return userData;
    } catch (error) {
      console.error(`Lỗi khi lấy thông tin user ${userId}:`, error);
      return null;
    }
  };

  useEffect(() => {
    const loadUsersForMessages = async () => {
      const userIds = [...new Set(messages.map(msg => msg.nguoiGuiId))];
      
      for (const userId of userIds) {
        if (!userCache[userId]) {
          await fetchUserById(userId);
        }
      }
    };

    if (messages.length > 0) {
      loadUsersForMessages();
    }
  }, [messages]);

  const getRoleName = (role) => {
    if (isCustomer(role)) {
      return 'Khách hàng';
    } else {
      return 'Admin';
    }
  };
 
  const getSenderInfo = (message) => {
    const roleName = getRoleName(message.vaiTroNguoiGui);
    const senderUser = userCache[message.nguoiGuiId];
    
    if (isStaff(user.vaiTro) && message.vaiTroNguoiGui !== 'KHACHHANG') {
      const senderName = senderUser ? (senderUser.hoTen || senderUser.username || 'N/A') : 'Đang tải...';
      return {
        role: roleName,
        details: `${senderName} (ID: ${message.nguoiGuiId})`
      };
    }
    
    return {
      role: roleName,
      details: null
    };
  };

  if (!user) {
    return <div className="chat-loading">Đang tải...</div>;
  }

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h2>
          {isCustomer(user.vaiTro) 
            ? 'Hỗ trợ khách hàng' 
            : 'Quản lý hội thoại khách hàng'}
        </h2>
        <div className="connection-status">
          {connecting && <span className="connecting">Đang kết nối...</span>}
          {stompClient && stompClient.connected && (
            <span className="connected">
              Đã kết nối 
            </span>
          )}
          {!stompClient && !connecting && (
            <span className="disconnected">Chưa kết nối</span>
          )}
          {sending && <span className="sending">Đang gửi...</span>}
        </div>
      </div>

      <div className="chat-content">
        {isStaff(user.vaiTro) && (
          <div className="chat-sidebar">
            <h3>Danh sách hội thoại</h3>
            <div className="conversations-list">
              {conversations.length === 0 ? (
                <p className="no-conversations">Chưa có hội thoại nào</p>
              ) : (
                conversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    className={`conversation-item ${
                      selectedCustomerId === conversation.khachHang.id ? 'active' : ''
                    }`}
                    onClick={() => loadChatWithCustomer(conversation.khachHang.id)}
                  >
                    <div className="customer-info">
                      <div className="customer-name">
                        {conversation.khachHang.hoTen || conversation.khachHang.username}
                      </div>
                      <div className="customer-email">
                        {conversation.khachHang.email}
                      </div>
                      {conversation.khachHang.soDienThoai && (
                        <div className="customer-phone">
                          📞 {conversation.khachHang.soDienThoai}
                        </div>
                      )}
                   
                      {conversation.tinNhanCuoiCung && (
                        <div className="last-message">
                          <div className="last-message-content">
                            {conversation.tinNhanCuoiCung.length > 50 
                              ? conversation.tinNhanCuoiCung.substring(0, 50) + '...'
                              : conversation.tinNhanCuoiCung
                            }
                          </div>
                          <div className="last-message-time">
                            {formatLastMessageTime(conversation.thoiGianTinNhanCuoi)}
                          </div>
                        </div>
                      )}
                      {!conversation.tinNhanCuoiCung && (
                        <div className="conversation-time">
                          Tạo: {formatTime(conversation.thoiGianTao)}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        <div className="chat-main">
          {currentConversation || isCustomer(user.vaiTro) ? (
            <>
              <div className="chat-conversation-header">
                {isCustomer(user.vaiTro) ? (
                  <div>
                    <h4>Hỗ trợ khách hàng</h4>
                    <span>Gửi tin nhắn để được hỗ trợ</span>
                  </div>
                ) : (
                  <div>
                    <h4>
                      Chat với: {currentConversation?.khachHang?.hoTen || 
                                 currentConversation?.khachHang?.username}
                    </h4>
                    <span>{currentConversation?.khachHang?.email}</span>
                    {currentConversation?.khachHang?.soDienThoai && (
                      <div className="customer-phone-header">
                        📞 {currentConversation.khachHang.soDienThoai}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="messages-container" ref={messagesContainerRef}>
                {loading ? (
                  <div className="messages-loading">Đang tải tin nhắn...</div>
                ) : messages.length === 0 ? (
                  <div className="no-messages">
                    {isCustomer(user.vaiTro) ? (
                      <>
                        <div className="welcome-message-inline">
                          <h3>Chào mừng bạn đến với hỗ trợ khách hàng!</h3>
                          <p>Hãy gửi tin nhắn đầu tiên để bắt đầu cuộc trò chuyện với đội ngũ hỗ trợ.</p>
                        </div>
                      </>
                    ) : (
                      "Chưa có tin nhắn nào. Hãy bắt đầu cuộc trò chuyện!"
                    )}
                  </div>
                ) : (
                  messages.map((message) => {
                    const senderInfo = getSenderInfo(message);
                    
                    let messagePosition;
                    if (isCustomer(user.vaiTro)) {
                      messagePosition = message.nguoiGuiId.toString() === idNguoiDung ? 'own-message' : 'other-message';
                    } else {
                      messagePosition = message.vaiTroNguoiGui !== "KHACHHANG" ? 'own-message' : 'other-message';
                    }
                    
                    return (
                      <div
                        key={message.id}
                        className={`message ${messagePosition}`}
                      >
                        <div className="message-info">
                          <span className="sender-role">
                            {senderInfo.role}
                          </span>
                          {senderInfo.details && (
                            <span className="sender-details">
                              {senderInfo.details}
                            </span>
                          )}
                          <span className="message-time">
                            {formatTime(message.thoiGianTao)}
                          </span>
                        </div>
                        <div className="message-content">
                          {message.noiDung}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="message-input-container">
                <div className="message-input-wrapper">
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={isCustomer(user.vaiTro) ? "Nhập tin nhắn nếu cần hỗ trợ..." : "Nhập tin nhắn..."}
                    className="message-input"
                    rows="3"
                    disabled={sending}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || connecting || sending}
                    className="send-button"
                  >
                    {sending ? 'Đang gửi...' : 'Gửi'}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="no-conversation-selected">
              <div className="select-conversation">
                <h3>Chọn một hội thoại để bắt đầu</h3>
                <p>Chọn khách hàng từ danh sách bên trái để xem và trả lời tin nhắn.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TinNhan;