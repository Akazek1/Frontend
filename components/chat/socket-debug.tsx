"use client"
import { useState, useEffect } from "react"
import { getSocket } from "@/lib/socket"

interface SocketDebugProps {
    bookingId: string
}

export default function SocketDebug({ bookingId }: SocketDebugProps) {
    const [events, setEvents] = useState<string[]>([])
    const [isConnected, setIsConnected] = useState(false)

    useEffect(() => {
        const socket = getSocket()
        if (!socket) return

        const addEvent = (event: string) => {
            setEvents((prev) => [...prev.slice(-9), `${new Date().toLocaleTimeString()}: ${event}`])
        }

        setIsConnected(socket.connected)

        socket.on("connect", () => {
            setIsConnected(true)
            addEvent("Connected")
        })

        socket.on("disconnect", () => {
            setIsConnected(false)
            addEvent("Disconnected")
        })

        socket.on("joinBookingSuccess", () => {
            addEvent("✅ Joined booking room")
        })

        socket.on("joinBookingError", (error) => {
            addEvent(`❌ Join error: ${error}`)
        })

        socket.on("newMessage", (message) => {
            addEvent(`📨 New message: ${message.content?.substring(0, 20)}...`)
        })

        socket.on("messagesRead", () => {
            addEvent("👁️ Messages marked as read")
        })

        // Test function
        const testJoinBooking = () => {
            if (socket.connected) {
                addEvent(`🧪 Testing joinBooking with ID: ${bookingId}`)
                socket.emit("joinBooking", bookingId)
            } else {
                addEvent("❌ Socket not connected")
            }
        }

        // Auto-test after 2 seconds
        const testTimeout = setTimeout(testJoinBooking, 2000)

        return () => {
            clearTimeout(testTimeout)
            socket.off("connect")
            socket.off("disconnect")
            socket.off("joinBookingSuccess")
            socket.off("joinBookingError")
            socket.off("newMessage")
            socket.off("messagesRead")
        }
    }, [bookingId])

    return (
        <div className="fixed bottom-20 right-4 bg-black bg-opacity-80 text-white p-3 rounded-lg text-xs max-w-xs">
            <div className="flex items-center gap-2 mb-2">
                <div className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`} />
                <span>Socket {isConnected ? "Connected" : "Disconnected"}</span>
            </div>
            <div className="space-y-1 max-h-32 overflow-y-auto">
                {events.map((event, index) => (
                    <div key={index} className="text-xs opacity-80">
                        {event}
                    </div>
                ))}
            </div>
        </div>
    )
}
