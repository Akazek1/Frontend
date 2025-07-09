"use client"
import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import api from "@/lib/axios"
import toast from "react-hot-toast"
import { initializeSocket, getSocket } from "@/lib/socket"
import BackButtonHeader from "@/components/header/back-button-header"
import { Check, CheckCheck, Loader2, Phone, Send } from "lucide-react"
import { useSelector } from "react-redux"
import type { RootState } from "@/store"

interface Message {
    id: string
    bookingId: string
    senderId: string
    content: string
    createdAt: string
    isRead: boolean
    sender: {
        id: string
        firstName: string
        lastName: string
    }
}

interface Booking {
    messages: Message[]
    id: string
    service: {
        id: string
        title: string
        providerId: string
    }
    worker: {
        id: string
        firstName: string
        lastName: string
    } | null
}

const Conversation: React.FC = () => {
    const { id } = useParams()
    const router = useRouter()
    const [booking, setBooking] = useState<Booking | null>(null)
    const [messages, setMessages] = useState<Message[]>([])
    const [newMessage, setNewMessage] = useState<string>("")
    const [loading, setLoading] = useState<boolean>(true)
    const [sending, setSending] = useState<boolean>(false)
    // const [socketConnected, setSocketConnected] = useState<boolean>(false)
    const [useSocketForMessages, setUseSocketForMessages] = useState<boolean>(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const { token, user } = useSelector((state: RootState) => state.auth)
    const currentUserId = user?.id || ""

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages])

    useEffect(() => {
        if (!token || !id || !currentUserId) {
            toast.error("Authentication required")
            router.push("/login")
            return
        }

        const socket = initializeSocket(token, currentUserId)

        let connectionTimeout: NodeJS.Timeout

        socket.on("connect", () => {
            // setSocketConnected(true)

            // Try to join the booking room
            socket.emit("joinBooking", id as string)

            // Set a timeout to fall back to REST API if no response
            connectionTimeout = setTimeout(() => {
                setUseSocketForMessages(false)
            }, 5000)
        })

        socket.on("disconnect", () => {
            // setSocketConnected(false)
            setUseSocketForMessages(false)
            if (connectionTimeout) clearTimeout(connectionTimeout)
        })

        socket.on("connect_error", (error) => {
            console.error("Socket connection error:", error)
            // setSocketConnected(false)
            setUseSocketForMessages(false)
        })

        socket.on("reconnect", () => {
            // setSocketConnected(true)
            socket.emit("joinBooking", id as string)
        })

        // Handle successful room join (if backend supports it)
        socket.on("joinBookingSuccess", () => {
            setUseSocketForMessages(true)
            if (connectionTimeout) clearTimeout(connectionTimeout)
        })

        socket.on("joinBookingError", (error) => {
            console.error("Failed to join booking room:", error)
            setUseSocketForMessages(false)
            if (connectionTimeout) clearTimeout(connectionTimeout)
            // Don't show error toast, just use REST API
        })

        // Handle new messages
        socket.on("newMessage", (message: Message) => {
            setMessages((prev) => {
                if (prev.some((m) => m.id === message.id)) {
                    return prev
                }

                const updated = [...prev, message].sort(
                    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
                )
                return updated
            })
        })

        // Handle message sent confirmation
        socket.on("messageSent", () => {
            setSending(false)
        })

        socket.on("messageError", (error) => {
            console.error("Message error:", error)
            setSending(false)
            // Don't show error toast, the fallback will handle it
        })

        // Handle messages read
        socket.on("messagesRead", ({ bookingId, userId }) => {
            if (bookingId === id && userId !== currentUserId) {
                // When the other user reads messages, mark YOUR messages as read
                setMessages((prev) =>
                    prev.map((msg) => {
                        if (msg.senderId === currentUserId) {
                            return { ...msg, isRead: true }
                        }
                        return msg
                    }),
                )
            }
        })

        return () => {
            if (connectionTimeout) clearTimeout(connectionTimeout)
            socket.off("connect")
            socket.off("disconnect")
            socket.off("connect_error")
            socket.off("reconnect")
            socket.off("joinBookingSuccess")
            socket.off("joinBookingError")
            socket.off("newMessage")
            socket.off("messageSent")
            socket.off("messageError")
            socket.off("messagesRead")
        }
    }, [id, token, router, currentUserId])

    // Polling for new messages when socket is not working
    useEffect(() => {
        if (!useSocketForMessages && !loading && booking) {
            const pollMessages = async () => {
                try {
                    const { data } = await api.get<{ data: Booking }>(`/bookings/${id}`)
                    const sortedMessages = data.data.messages.sort(
                        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
                    )

                    // Only update if there are actual changes in messages
                    const hasChanges =
                        sortedMessages.some((newMsg, index) => {
                            const existingMsg = messages[index]
                            return (
                                !existingMsg ||
                                existingMsg.id !== newMsg.id ||
                                existingMsg.isRead !== newMsg.isRead ||
                                existingMsg.content !== newMsg.content
                            )
                        }) || sortedMessages.length !== messages.length

                    if (hasChanges) {
                        setMessages(sortedMessages)
                    }
                } catch (error) {
                    console.error("Error polling messages:", error)
                }
            }

            const interval = setInterval(pollMessages, 3000) // Poll every 3 seconds
            return () => clearInterval(interval)
        }
    }, [useSocketForMessages, loading, booking, id])

    // Mark messages as read when messages change
    useEffect(() => {
        if (messages.length > 0 && currentUserId && id) {
            const unreadMessages = messages.filter((msg) => msg.senderId !== currentUserId && !msg.isRead)

            if (unreadMessages.length > 0) {
                // Add a small delay to avoid marking messages as read immediately
                const timeoutId = setTimeout(() => {
                    if (useSocketForMessages) {
                        const socket = getSocket()
                        if (socket?.connected) {
                            socket.emit("markMessagesAsRead", { bookingId: id })
                        }
                    } else {
                        // Use REST API to mark as read
                        api.patch(`/bookings/messages/${id}/read`).catch((error) => {
                            console.error("Error marking messages as read:", error)
                        })
                    }
                }, 1000) // 1 second delay

                return () => clearTimeout(timeoutId)
            }
        }
    }, [messages, currentUserId, id, useSocketForMessages])

    useEffect(() => {
        const fetchBooking = async () => {
            if (!id || !token) return

            setLoading(true)
            try {
                const { data } = await api.get<{ data: Booking }>(`/bookings/${id}`)
                setBooking(data.data)
                const sortedMessages = data.data.messages.sort(
                    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
                )
                setMessages(sortedMessages)
            } catch (error: unknown) {
                const message =
                    typeof error === "object" &&
                        error !== null &&
                        "response" in error &&
                        (error as { response?: { data?: { message?: string } } }).response?.data?.message
                        ? (error as { response: { data: { message: string } } }).response.data.message
                        : "Failed to fetch booking."
                toast.error(message)
            } finally {
                setLoading(false)
            }
        }

        fetchBooking()
    }, [id, token, router])

    const sendViaRestAPI = async (messageContent: string) => {
        try {
            console.log("Sending message via REST API:", messageContent)
            const res = await api.post(`/bookings/${id}/messages`, { content: messageContent }, { withCredentials: true })
            if (res.data?.data) {
                setMessages((prev) => {
                    if (prev.some((m) => m.id === res.data.data.id)) {
                        return prev
                    }
                    const updated = [...prev, res.data.data].sort(
                        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
                    )
                    return updated
                })
                toast.success("Message sent")
            }
        } catch (error: unknown) {
            const message =
                typeof error === "object" &&
                    error !== null &&
                    "response" in error &&
                    (error as { response?: { data?: { message?: string } } }).response?.data?.message
                    ? (error as { response: { data: { message: string } } }).response.data.message
                    : "Failed to send message."
            toast.error(message)
        } finally {
            setSending(false)
        }
    }

    const handleSendMessage = async () => {
        if (!newMessage.trim()) {
            toast.error("Message cannot be empty")
            return
        }
        if (sending) return

        const messageContent = newMessage.trim()
        setNewMessage("") // Clear input immediately
        setSending(true)

        // Always use REST API since socket auth might not work
        await sendViaRestAPI(messageContent)
    }

    const formatTimestamp = (iso: string) => {
        const date = new Date(iso)
        const now = new Date()
        const diff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

        if (diff === 0) {
            return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        }
        if (diff === 1) return "Yesterday"
        return date.toLocaleDateString([], { month: "short", day: "numeric" })
    }

    if (loading) {
        return (
            <div className="min-h-screen flex justify-center items-center bg-gray-50">
                <Loader2 className="w-6 h-6 animate-spin text-[#7210FF]" />
            </div>
        )
    }

    if (!booking) {
        return (
            <div className="min-h-screen p-4 bg-gray-50">
                <BackButtonHeader text="Conversation" backHref="/conversations" />
                <p className="text-center text-red-500">Conversation not found</p>
            </div>
        )
    }

    return (
        <div className="relative flex flex-col h-screen p-6 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
                <BackButtonHeader
                    text={booking.worker ? `${booking.worker.firstName} ${booking.worker.lastName}` : "Agency Worker"}
                    backHref="/conversations"
                />
                <div className="flex items-center space-x-3">
                    <Phone className="text-[#222222] w-6 h-6" />
                    <span className="cursor-pointer">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="lucide lucide-message-circle-more-icon lucide lucide-circle-more"
                        >
                            <path d="M12.0002 1.2085C17.9595 1.2085 22.7918 6.03966 22.7918 12.0002C22.7918 17.9595 17.9595 22.7918 12.0002 22.7918C6.03966 22.7918 1.2085 17.9595 1.2085 12.0002C1.2085 6.04083 6.04083 1.2085 12.0002 1.2085Z" />
                            <path d="M8 12h.01" />
                            <path d="M12 12h.01" />
                            <path d="M16 12h.01" />
                        </svg>
                    </span>
                </div>
            </div>

            {/* Connection status indicator */}
            {/* <div className="flex items-center justify-center mb-2 space-x-4">
                <div className="flex items-center">
                    <div className={`w-2 h-2 rounded-full ${socketConnected ? "bg-green-500" : "bg-red-500"}`} />
                    <span className="ml-2 text-xs text-gray-500">{socketConnected ? "Connected" : "Offline Mode"}</span>
                </div>
                <div className="flex items-center">
                    <div className={`w-2 h-2 rounded-full ${useSocketForMessages ? "bg-blue-500" : "bg-orange-500"}`} />
                    <span className="ml-2 text-xs text-gray-500">{useSocketForMessages ? "Real-time" : "Polling"}</span>
                </div>
            </div> */}

            <div className="flex flex-col space-y-[10px] mt-4 flex-1 overflow-y-auto scrollbar-hide pb-10">
                {messages.length === 0 ? (
                    <p className="text-center text-gray-500">No messages yet.</p>
                ) : (
                    messages.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.senderId === currentUserId ? "justify-end" : "justify-start"}`}>
                            <div
                                className={`max-w-[70%] p-3 tracking-[0.2px] rounded-b-[12px] ${msg.senderId === currentUserId
                                    ? "bg-gradient-to-tl from-[#145B10] to-[#289723] text-white rounded-tl-[12px]"
                                    : "bg-[#F5F5F5] text-black rounded-tr-lg"
                                    }`}
                            >
                                <p>{msg.content}</p>
                                <div className="flex items-center justify-between mt-1">
                                    <p className={`text-sm ${msg.senderId === currentUserId ? "text-white" : "text-[#757575]"}`}>
                                        {formatTimestamp(msg.createdAt)}
                                    </p>
                                    {msg.senderId === currentUserId && (
                                        <span className={`text-xs ml-2 ${msg.isRead ? "text-blue-200" : "text-gray-300"}`}>
                                            {msg.isRead
                                                ?
                                                <CheckCheck className="w-5 h-5" />
                                                :
                                                <Check className="w-5 h-5" />
                                            }
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="absolute z-50 w-[95%] bottom-5 left-1/2 -translate-x-1/2 flex items-center space-x-2 p-1 rounded-lg">
                <input
                    type="text"
                    placeholder="Message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && !sending) handleSendMessage()
                    }}
                    className="flex-1 p-2 border-none focus:outline-none bg-[#FAFAFA] w-[90%] rounded-lg"
                    disabled={sending}
                />
                <button
                    className="p-2.5 bg-gradient-to-tl from-[#145B10] to-[#289723] rounded-full text-white disabled:opacity-50"
                    onClick={handleSendMessage}
                    disabled={sending}
                >
                    {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                </button>
            </div>
        </div>
    )
}

export default Conversation
